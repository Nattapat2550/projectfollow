// backend/controllers/illegalController.js

const pool = require("../config/db"); 
const { v4: uuidv4 } = require("uuid"); 
const xlsx = require("xlsx");
const { uploadToDrive, deleteFromDrive, extractDriveFileId } = require("../services/googleDriveService");
const { safeParseDate, normalizeNationality, processName, processVictimStatus, findValue, determineGender, parseThaiDateToDate } = require("../utils/immigrantHelpers");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

if (!global.uploadProgress) {
  global.uploadProgress = {};
}

exports.getIllegalById = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM illegal_immigrants WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Not found" });
    
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
    if (req.file) {
      const driveRes = await uploadToDrive(req.file, process.env.GOOGLE_DRIVE_FOLDER_ID);
      photo_url = driveRes.webViewLink;
    }

    const id = uuidv4();
    const query = `
      INSERT INTO illegal_immigrants 
      (id, first_name_th, middle_name_th, last_name_th, first_name_en, middle_name_en, last_name_en, 
       passport_id, gender, nationality, detected_location, workplace, warrant, screening_details, is_victim, detected_date, photo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *;
    `;
    const values = [
      id, data.first_name_th, data.middle_name_th || null, data.last_name_th,
      data.first_name_en || null, data.middle_name_en || null, data.last_name_en || null,
      data.passport_id || null, data.gender || null, data.nationality ? normalizeNationality(data.nationality) : null,
      data.detected_location || "ไม่ระบุ", data.workplace || null, data.warrant || null, data.screening_details || null,
      data.is_victim === "true" || data.is_victim === true || false,
      safeParseDate(data.detected_date), photo_url
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
    if (req.file) {
      if (existingData.photo_url) {
        const oldFileId = extractDriveFileId(existingData.photo_url);
        if (oldFileId) {
          try { await deleteFromDrive(oldFileId); } catch (delErr) { console.error(delErr.message); }
        }
      }
      const driveRes = await uploadToDrive(req.file, process.env.GOOGLE_DRIVE_FOLDER_ID);
      photo_url = driveRes.webViewLink;
    }

    const query = `
      UPDATE illegal_immigrants SET 
        first_name_th=$1, middle_name_th=$2, last_name_th=$3, first_name_en=$4, middle_name_en=$5, last_name_en=$6, 
        passport_id=$7, gender=$8, nationality=$9, detected_location=$10, workplace=$11, warrant=$12, screening_details=$13, 
        is_victim=$14, detected_date=$15, photo_url=$16
      WHERE id=$17 RETURNING *;
    `;
    const values = [
      data.first_name_th, data.middle_name_th || null, data.last_name_th,
      data.first_name_en || null, data.middle_name_en || null, data.last_name_en || null,
      data.passport_id || null, data.gender || null, data.nationality ? normalizeNationality(data.nationality) : null,
      data.detected_location || "ไม่ระบุ", data.workplace || null, data.warrant || null, data.screening_details || null,
      data.is_victim === "true" || data.is_victim === true || false,
      safeParseDate(data.detected_date), photo_url, id
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
    const existingDataRes = await pool.query("SELECT photo_url FROM illegal_immigrants WHERE id = $1", [id]);
    
    if (existingDataRes.rows.length > 0 && existingDataRes.rows[0].photo_url) {
       const fileId = extractDriveFileId(existingDataRes.rows[0].photo_url);
       if(fileId) { try { await deleteFromDrive(fileId); } catch(e) { console.error(e); } }
    }
    
    await pool.query("DELETE FROM illegal_immigrants WHERE id = $1", [id]);
    res.status(200).json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.getUploadProgress = (req, res) => {
  const jobId = req.params.jobId;
  const progress = global.uploadProgress[jobId] || { current: 0, total: 0, status: 'pending' };
  res.json(progress);
};

exports.uploadExcelIllegal = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "กรุณาอัปโหลดไฟล์ Excel" });

    const action = req.query.action || "upload";
    const jobId = req.query.jobId;

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

    if (allJsonData.length === 0) return res.status(400).json({ success: false, message: "ไม่พบข้อมูลในไฟล์ Excel หรือไม่มีรายชื่อให้บันทึก (ระวังบรรทัดว่าง)" });

    if (action === "preview") {
      const preview_data = [];
      for (let i = 0; i < allJsonData.length; i++) {
        // ... (ส่วน Preview คงเดิม)
        const row = allJsonData[i];
        const rawFullName = findValue(row, "ชื่อสกุล") || findValue(row, "ชื่อ") || "";
        const { prefix, fname, mname, lname, isThai, hasName } = processName(rawFullName);
        const { isVictim, details } = processVictimStatus(row);
        
        let rawPass = findValue(row, "เลขหนังสือเดินทาง") || findValue(row, "Passport");
        let passport = rawPass ? String(rawPass).replace(/\s/g, '').trim() : null;
        if (passport && ["-", "ไม่มี", "ไม่ระบุ", "none", "n/a", "null"].includes(passport.toLowerCase())) passport = null;

        let dateObj = parseThaiDateToDate(row._sheetName);

        preview_data.push({
          ลำดับที่อ่านได้: i + 1,
          first_name_th: hasName && isThai && fname ? fname : "ไม่ระบุ",
          middle_name_th: isThai ? mname : null,
          last_name_th: hasName && isThai && lname ? lname : "ไม่ระบุ",
          first_name_en: hasName && !isThai ? fname || null : null,
          middle_name_en: !isThai ? mname : null,
          last_name_en: hasName && !isThai ? lname || null : null,
          nationality: findValue(row, "สัญชาติ") ? normalizeNationality(findValue(row, "สัญชาติ")) : null, 
          passport_id: passport,
          detected_location: findValue(row, "สถานที่ตรวจพบ") ? String(findValue(row, "สถานที่ตรวจพบ")) : "ไม่ระบุ",
          workplace: findValue(row, "สถานที่ทำงาน") ? String(findValue(row, "สถานที่ทำงาน")) : null,
          warrant: findValue(row, "หมายจับ") ? String(findValue(row, "หมายจับ")) : null,
          gender: determineGender(row, prefix),
          detected_date: dateObj ? dateObj.toISOString().split('T')[0] : null,
          is_victim: isVictim,
          screening_details: details,
          raw_data_from_excel: row
        });
      }
      return res.status(200).json({ success: true, message: "ดึงข้อมูลพรีวิวสำเร็จ", total_rows: preview_data.length, preview_data });
    }

    if (jobId) {
       global.uploadProgress[jobId] = { current: 0, total: allJsonData.length, status: 'processing' };
    }

    // 🟢 แยกตัวนับ Insert (เพิ่มใหม่) และ Update (แก้ไขของเดิม)
    let insertedCount = 0;
    let updatedCount = 0;
    let errors = [];

    for (let i = 0; i < allJsonData.length; i++) {
      const row = allJsonData[i];
      const rawFullName = findValue(row, "ชื่อสกุล") || findValue(row, "ชื่อ") || "";
      const { prefix, fname, mname, lname, isThai, hasName } = processName(rawFullName);
      const { isVictim, details } = processVictimStatus(row);
      
      let rawPass = findValue(row, "เลขหนังสือเดินทาง") || findValue(row, "Passport");
      let passport_id = rawPass ? String(rawPass).replace(/\s/g, '').trim() : null;
      if (passport_id && ["-", "ไม่มี", "ไม่ระบุ", "none", "n/a", "null"].includes(passport_id.toLowerCase())) {
          passport_id = null;
      }

      try {
         let existingId = null;
         if (passport_id) {
             const checkRes = await pool.query("SELECT id FROM illegal_immigrants WHERE passport_id = $1", [passport_id]);
             if (checkRes.rows.length > 0) existingId = checkRes.rows[0].id;
         }

         const values = [
            (hasName && isThai && fname ? fname : "ไม่ระบุ") || null,
            (isThai ? mname : null) || null,
            (hasName && isThai && lname ? lname : "ไม่ระบุ") || null,
            (hasName && !isThai ? fname : null) || null,
            (!isThai ? mname : null) || null,
            (hasName && !isThai ? lname : null) || null,
            findValue(row, "สัญชาติ") ? normalizeNationality(findValue(row, "สัญชาติ")) : null,
            passport_id,
            findValue(row, "สถานที่ตรวจพบ") ? String(findValue(row, "สถานที่ตรวจพบ")) : "ไม่ระบุ",
            findValue(row, "สถานที่ทำงาน") ? String(findValue(row, "สถานที่ทำงาน")) : null,
            findValue(row, "หมายจับ") ? String(findValue(row, "หมายจับ")) : null,
            determineGender(row, prefix) || null,
            parseThaiDateToDate(row._sheetName) || null,
            isVictim,
            details || null
         ];

         if (existingId) {
             // 🟢 ถ้าเจอพาสปอร์ตซ้ำ ทำการ UPDATE และบวกเลข updatedCount
             const updateQ = `UPDATE illegal_immigrants SET 
                first_name_th=$1, middle_name_th=$2, last_name_th=$3, first_name_en=$4, middle_name_en=$5, last_name_en=$6, 
                nationality=$7, passport_id=$8, detected_location=$9, workplace=$10, warrant=$11, gender=$12, detected_date=$13, 
                is_victim=$14, screening_details=$15 WHERE id=$16`;
             await pool.query(updateQ, [...values, existingId]);
             updatedCount++;
         } else {
             // 🟢 ถ้าไม่ซ้ำ ทำการ INSERT และบวกเลข insertedCount
             const insertQ = `INSERT INTO illegal_immigrants 
                (id, first_name_th, middle_name_th, last_name_th, first_name_en, middle_name_en, last_name_en, 
                nationality, passport_id, detected_location, workplace, warrant, gender, detected_date, is_victim, screening_details) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`;
             await pool.query(insertQ, [uuidv4(), ...values]);
             insertedCount++;
         }
      } catch (dbErr) {
         console.error(`\n❌ [DB Error] แถวที่ ${i+1} ข้ามการบันทึก: ${dbErr.message}`);
         errors.push(`แถวที่ ${i+1}: ${dbErr.message}`);
      }

      if (jobId && global.uploadProgress[jobId]) {
         global.uploadProgress[jobId].current = i + 1;
      }

      // 🟢 หน่วงเวลาทุกๆ 1 แถวเพื่อความชัวร์ที่สุด (ป้องกัน Connection Pool เต็มแบบ 100%)
      await delay(20);
    }

    if (jobId && global.uploadProgress[jobId]) global.uploadProgress[jobId].status = 'completed';

    // 🟢 ส่งข้อความกลับไปอธิบายให้ผู้ใช้งานเข้าใจว่าทำไมตารางถึงขยับไม่เท่ากัน
    res.status(200).json({ 
        success: true, 
        message: `ประมวลผลสำเร็จ ${insertedCount + updatedCount} รายการ (เพิ่มลง DB ใหม่: ${insertedCount} คน, อัปเดตข้อมูลเดิม: ${updatedCount} คน) จากทั้งหมด ${allJsonData.length} รายการ`,
        errors: errors.length > 0 ? errors : undefined 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการอ่านไฟล์และบันทึกข้อมูล" });
  }
};