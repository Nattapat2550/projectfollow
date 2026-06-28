const pool = require("../config/db"); 
const { v4: uuidv4 } = require("uuid"); 
const fs = require('fs');
const path = require('path');
const xlsx = require("xlsx");
const { uploadToDrive, deleteFromDrive, extractDriveFileId } = require("../services/googleDriveService");
const { safeParseDate, normalizeNationality, processName, processVictimStatus, findValue, determineGender, parseThaiDateToDate } = require("../utils/immigrantHelpers");

let thaiAddresses = [];
try {
    const addressPath = path.join(__dirname, '../../frontend/public/thai_addresses.json');
    thaiAddresses = JSON.parse(fs.readFileSync(addressPath, 'utf-8'));
} catch (err) {
    console.error("Could not load thai_addresses.json for address parsing", err);
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const splitThaiAddress = (fullAddress) => {
    if (!fullAddress || typeof fullAddress !== 'string') {
        return { details: "ไม่ระบุ", sub_district: null, district: null, province: null };
    }
    
    let str = fullAddress.trim();
    let province = null, district = null, sub_district = null;
    
    // หา จังหวัด
    const provMatch = str.match(/(?:จ\.| จว\.|จังหวัด)\s*([^\s]+)/) || str.match(/\s(กรุงเทพมหานคร|กรุงเทพฯ|กทม\.?|เชียงใหม่|ภูเก็ต|โคราช|ชลบุรี)$/);
    if (provMatch) {
        province = provMatch[1];
        str = str.replace(provMatch[0], '').trim();
    }
    
    // หา อำเภอ / เขต
    const distMatch = str.match(/(?:อ\.|อำเภอ|เขต)\s*([^\s]+)/);
    if (distMatch) {
        district = distMatch[1];
        str = str.replace(distMatch[0], '').trim();
    }
    
    // หา ตำบล / แขวง
    const subMatch = str.match(/(?:ต\.|ตำบล|แขวง)\s*([^\s]+)/);
    if (subMatch) {
        sub_district = subMatch[1];
        str = str.replace(subMatch[0], '').trim();
    }
    
    // Smart autofill using thai_addresses.json
    if (sub_district && (!district || !province) && thaiAddresses.length > 0) {
        // Find all matches for this sub_district
        const matches = thaiAddresses.filter(addr => addr.district === sub_district);
        
        if (matches.length > 0) {
            // Check if it's unique across the country (i.e., all matches have the same district/province)
            const uniqueDistricts = new Set(matches.map(m => m.amphoe));
            const uniqueProvinces = new Set(matches.map(m => m.province));
            
            if (uniqueDistricts.size === 1 && uniqueProvinces.size === 1) {
                if (!district) district = matches[0].amphoe;
                if (!province) province = matches[0].province;
            }
        }
    } else if (district && !province && thaiAddresses.length > 0) {
        const matches = thaiAddresses.filter(addr => addr.amphoe === district);
        if (matches.length > 0) {
            const uniqueProvinces = new Set(matches.map(m => m.province));
            if (uniqueProvinces.size === 1) {
                province = matches[0].province;
            }
        }
    }
    
    return {
        details: str || "ไม่ระบุ",
        sub_district,
        district,
        province
    };
};

if (!global.uploadProgress) {
  global.uploadProgress = {};
}

exports.getIllegalById = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT t.*, u.name AS creator_name, u.color AS creator_color FROM illegal_immigrants t LEFT JOIN users u ON t.created_by = u.id WHERE t.id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(200).json({ success: false, message: "Not found" });
    
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
};

exports.createIllegal = async (req, res) => {
  try {
    const data = req.body;
    if (!data.first_name_th || !data.last_name_th) {
      return res.status(400).json({ success: false, message: "กรุณาระบุชื่อและนามสกุลภาษาไทย" });
    }

    let photo_url = null;
    let passport_photo_url = null;
    if (req.files) {
      if (req.files.photo) {
        const driveRes = await uploadToDrive(req.files.photo[0], process.env.GOOGLE_DRIVE_FOLDER_ID);
        photo_url = driveRes.webViewLink;
      }
      if (req.files.passport_photo) {
        const driveRes = await uploadToDrive(req.files.passport_photo[0], process.env.GOOGLE_DRIVE_FOLDER_ID);
        passport_photo_url = driveRes.webViewLink;
      }
    }

    const created_by = req.user ? req.user.id : null;
    const id = uuidv4();
    
    let passport_id = data.passport_id ? String(data.passport_id).trim() : null;
    if (passport_id === "") passport_id = null;

    // ลบ warrant ออก, ใส่ note
    const query = `
      INSERT INTO illegal_immigrants 
      (id, first_name_th, middle_name_th, last_name_th, first_name_en, middle_name_en, last_name_en, 
        passport_id, gender, nationality, detected_location_details, detected_location_sub_district, detected_location_district, detected_location_province, workplace, screening_details, is_victim, detected_date, note, photo_url, passport_photo_url, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *;
    `;
    const values = [
      id, data.first_name_th, data.middle_name_th || null, data.last_name_th,
      data.first_name_en || null, data.middle_name_en || null, data.last_name_en || null,
      passport_id, data.gender || null, data.nationality ? normalizeNationality(data.nationality) : null,
      data.detected_location_details || "ไม่ระบุ", data.detected_location_sub_district || null, data.detected_location_district || null, data.detected_location_province || null, data.workplace || null, data.screening_details || null,
      data.is_victim === "true" || data.is_victim === true || false,
      safeParseDate(data.detected_date), data.note || null, photo_url, passport_photo_url, created_by
    ];

    const result = await pool.query(query, values);
    res.status(201).json({ success: true, data: result.rows[0], message: "บันทึกข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.updateIllegal = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingDataRes = await pool.query("SELECT * FROM illegal_immigrants WHERE id = $1", [id]);
    if (existingDataRes.rows.length === 0) return res.status(404).json({ success: false, message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
    const existingData = existingDataRes.rows[0];

    let photo_url = existingData.photo_url;
    let passport_photo_url = existingData.passport_photo_url;
    
    if (req.files) {
      if (req.files.photo) {
        if (existingData.photo_url) {
          const oldFileId = extractDriveFileId(existingData.photo_url);
          if (oldFileId) {
            try { await deleteFromDrive(oldFileId); } catch (delErr) { console.error(delErr.message); }
          }
        }
        const driveRes = await uploadToDrive(req.files.photo[0], process.env.GOOGLE_DRIVE_FOLDER_ID);
        photo_url = driveRes.webViewLink;
      }
      
      if (req.files.passport_photo) {
        if (existingData.passport_photo_url) {
          const oldFileId = extractDriveFileId(existingData.passport_photo_url);
          if (oldFileId) {
            try { await deleteFromDrive(oldFileId); } catch (delErr) { console.error(delErr.message); }
          }
        }
        const driveRes = await uploadToDrive(req.files.passport_photo[0], process.env.GOOGLE_DRIVE_FOLDER_ID);
        passport_photo_url = driveRes.webViewLink;
      }
    }

    let passport_id = data.passport_id ? String(data.passport_id).trim() : null;
    if (passport_id === "") passport_id = null;

    const query = `
      UPDATE illegal_immigrants SET 
        first_name_th=$1, middle_name_th=$2, last_name_th=$3, first_name_en=$4, middle_name_en=$5, last_name_en=$6, 
        passport_id=$7, gender=$8, nationality=$9, detected_location_details=$10, detected_location_sub_district=$11, detected_location_district=$12, detected_location_province=$13, workplace=$14, screening_details=$15, 
        is_victim=$16, detected_date=$17, note=$18, photo_url=$19, passport_photo_url=$20, updated_at=NOW()
      WHERE id=$21 RETURNING *;
    `;
    const values = [
      data.first_name_th, data.middle_name_th || null, data.last_name_th,
      data.first_name_en || null, data.middle_name_en || null, data.last_name_en || null,
      passport_id, data.gender || null, data.nationality ? normalizeNationality(data.nationality) : null,
      data.detected_location_details || "ไม่ระบุ", data.detected_location_sub_district || null, data.detected_location_district || null, data.detected_location_province || null, data.workplace || null, data.screening_details || null,
      data.is_victim === "true" || data.is_victim === true || false,
      safeParseDate(data.detected_date), data.note || null, photo_url, passport_photo_url, id
    ];

    const result = await pool.query(query, values);
    res.status(200).json({ success: true, data: result.rows[0], message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.deleteIllegal = async (req, res) => {
  try {
    const { id } = req.params;
    const existingDataRes = await pool.query("SELECT photo_url, passport_photo_url FROM illegal_immigrants WHERE id = $1", [id]);
    
    if (existingDataRes.rows.length > 0) {
       const row = existingDataRes.rows[0];
       if (row.photo_url) {
           const fileId = extractDriveFileId(row.photo_url);
           if(fileId) { try { await deleteFromDrive(fileId); } catch(e) { console.error(e); } }
       }
       if (row.passport_photo_url) {
           const fileId2 = extractDriveFileId(row.passport_photo_url);
           if(fileId2) { try { await deleteFromDrive(fileId2); } catch(e) { console.error(e); } }
       }
    }
    
    await pool.query("DELETE FROM illegal_immigrants WHERE id = $1", [id]);
    res.status(200).json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.getUploadProgress = (req, res) => {
  const jobId = req.params.jobId;
  const progress = global.uploadProgress[jobId] || { current: 0, total: 0, successCount: 0, failedCount: 0, status: 'pending' };
  res.json(progress);
};

exports.uploadExcelIllegal = async (req, res) => {
  try {
    if (!req.file) {
       return res.status(400).json({ success: false, message: "กรุณาอัปโหลดไฟล์ Excel" });
    }

    const action = req.query.action || "upload";
    const jobId = req.query.jobId;
    const created_by = req.user ? req.user.id : null; 

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    let allJsonData = [];
    
    workbook.SheetNames.forEach(sheetName => {
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
      if (sheetData.length > 0) {
        allJsonData.push(...sheetData.map(row => ({ ...row, _sheetName: sheetName })));
      }
    });

    allJsonData = allJsonData.filter(row => {
        const rawFullName = findValue(row, "ชื่อสกุล") || findValue(row, "ชื่อ") || "";
        const rawPassport = findValue(row, "เลขหนังสือเดินทาง") || findValue(row, "Passport") || "";
        const { hasName } = processName(rawFullName);
        return hasName || String(rawPassport).trim() !== "";
    });

    if (allJsonData.length === 0) {
       return res.status(400).json({ success: false, message: "ไม่พบข้อมูลในไฟล์ Excel หรือไม่มีรายชื่อให้บันทึก (ระวังบรรทัดว่าง)" });
    }

    if (action === "preview") {
      const preview_data = [];
      for (let i = 0; i < allJsonData.length; i++) {
        const row = allJsonData[i];
        const rawFullName = findValue(row, "ชื่อสกุล") || findValue(row, "ชื่อ") || "";
        const { prefix, fname, mname, lname, isThai, hasName } = processName(rawFullName);
        const { isVictim, details } = processVictimStatus(row);
        
        let rawPass = findValue(row, "เลขหนังสือเดินทาง") || findValue(row, "Passport");
        let passport = rawPass ? String(rawPass).replace(/\s/g, '').trim() : null;
        
        // แก้ไข: เปลี่ยน String ว่างให้เป็น null เพื่อป้องกัน Error Duplicate Key
        if (passport === "") passport = null;
        if (passport && ["-", "ไม่มี", "ไม่ระบุ", "none", "n/a", "null"].includes(passport.toLowerCase())) passport = null;

        let dateObj = parseThaiDateToDate(row._sheetName);

        const locationRaw = findValue(row, "สถานที่ตรวจพบ");
        const parsedLocation = splitThaiAddress(locationRaw ? String(locationRaw) : "");

        preview_data.push({
          ลำดับที่อ่านได้: i + 1,
          first_name_th: (hasName && isThai && fname && fname.trim() !== "") ? fname.trim() : "ไม่ระบุ",
          middle_name_th: (isThai && mname && mname.trim() !== "") ? mname.trim() : null,
          last_name_th: (hasName && isThai && lname && lname.trim() !== "") ? lname.trim() : "ไม่ระบุ",
          first_name_en: (hasName && !isThai && fname && fname.trim() !== "") ? fname.trim() : null,
          middle_name_en: (!isThai && mname && mname.trim() !== "") ? mname.trim() : null,
          last_name_en: (hasName && !isThai && lname && lname.trim() !== "") ? lname.trim() : null,
          nationality: findValue(row, "สัญชาติ") ? normalizeNationality(findValue(row, "สัญชาติ")) : null, 
          passport_id: passport,
          detected_location_details: parsedLocation.details,
          detected_location_sub_district: parsedLocation.sub_district,
          detected_location_district: parsedLocation.district,
          detected_location_province: parsedLocation.province,
          workplace: findValue(row, "สถานที่ทำงาน") ? String(findValue(row, "สถานที่ทำงาน")).trim() : null,
          gender: determineGender(row, prefix),
          detected_date: dateObj ? dateObj.toISOString().split('T')[0] : null,
          is_victim: typeof isVictim === 'boolean' ? isVictim : false,
          screening_details: details,
          raw_data_from_excel: row
        });
      }
      return res.status(200).json({ success: true, message: "ดึงข้อมูลพรีวิวสำเร็จ", total_rows: preview_data.length, preview_data });
    }

    if (jobId) {
       global.uploadProgress[jobId] = { 
           current: 0, total: allJsonData.length, successCount: 0, failedCount: 0, status: 'processing' 
       };
    }

    let processedCount = 0;
    let errors = [];

    const insertQuery = `
      INSERT INTO illegal_immigrants 
      (id, first_name_th, middle_name_th, last_name_th, first_name_en, middle_name_en, last_name_en, 
       nationality, passport_id, detected_location_details, detected_location_sub_district, detected_location_district, detected_location_province, workplace, gender, detected_date, is_victim, screening_details, note, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20);
    `;

    for (let i = 0; i < allJsonData.length; i++) {
      const row = allJsonData[i];
      const rawFullName = findValue(row, "ชื่อสกุล") || findValue(row, "ชื่อ") || "";
      const { prefix, fname, mname, lname, isThai, hasName } = processName(rawFullName);
      const { isVictim, details } = processVictimStatus(row);
      
      let rawPass = findValue(row, "เลขหนังสือเดินทาง") || findValue(row, "Passport");
      let passport_id = rawPass ? String(rawPass).replace(/\s/g, '').trim() : null;
      
      // แก้ไข: เปลี่ยน String ว่างให้เป็น null ป้องกัน Duplicate Key Constraint
      if (passport_id === "") passport_id = null;
      if (passport_id && ["-", "ไม่มี", "ไม่ระบุ", "none", "n/a", "null"].includes(passport_id.toLowerCase())) {
          passport_id = null;
      }

      const locationRaw = findValue(row, "สถานที่ตรวจพบ");
      const parsedLocation = splitThaiAddress(locationRaw ? String(locationRaw) : "");

      const first_name_th = (hasName && isThai && fname && fname.trim() !== "") ? fname.trim() : "ไม่ระบุ";
      const middle_name_th = (isThai && mname && mname.trim() !== "") ? mname.trim() : null;
      const last_name_th = (hasName && isThai && lname && lname.trim() !== "") ? lname.trim() : "ไม่ระบุ";
      const first_name_en = (hasName && !isThai && fname && fname.trim() !== "") ? fname.trim() : null;
      const middle_name_en = (!isThai && mname && mname.trim() !== "") ? mname.trim() : null;
      const last_name_en = (hasName && !isThai && lname && lname.trim() !== "") ? lname.trim() : null;
      const nationality = findValue(row, "สัญชาติ") ? normalizeNationality(findValue(row, "สัญชาติ")) : null;
      const workplace = findValue(row, "สถานที่ทำงาน") ? String(findValue(row, "สถานที่ทำงาน")).trim() : null;
      const gender = determineGender(row, prefix) || null;
      const detected_date = parseThaiDateToDate(row._sheetName) || null;
      const is_victim_bool = typeof isVictim === 'boolean' ? isVictim : false;

      try {
         const insertValues = [
             uuidv4(), first_name_th, middle_name_th, last_name_th, first_name_en, middle_name_en, last_name_en,
             nationality, passport_id, parsedLocation.details, parsedLocation.sub_district, parsedLocation.district, parsedLocation.province, workplace, gender, detected_date, is_victim_bool, details || null, null, created_by
         ];
         
         await pool.query(insertQuery, insertValues);
         processedCount++;
         
         if (jobId && global.uploadProgress[jobId]) {
             global.uploadProgress[jobId].successCount = processedCount;
         }
      } catch (dbErr) {
         console.error(`\n❌ [DB Error] แถวที่ ${i+1}: ${dbErr.message}`);
         errors.push(`แถว ${i+1}: ${dbErr.message}`);
         if (jobId && global.uploadProgress[jobId]) {
             global.uploadProgress[jobId].failedCount = (global.uploadProgress[jobId].failedCount || 0) + 1;
         }
      }

      if (jobId && global.uploadProgress[jobId]) {
         global.uploadProgress[jobId].current = i + 1;
      }
    }

    if (jobId && global.uploadProgress[jobId]) global.uploadProgress[jobId].status = 'completed';

    res.status(200).json({ 
        success: true, 
        message: `นำเข้าข้อมูลลงฐานข้อมูลสมบูรณ์ จำนวน ${processedCount} รายการ`,
        errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการอ่านไฟล์และบันทึกข้อมูล" });
  }
};