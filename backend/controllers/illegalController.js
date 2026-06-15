// backend/controllers/illegalController.js

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const xlsx = require("xlsx");
const { uploadToDrive, deleteFromDrive, extractDriveFileId } = require("../services/googleDriveService");
const { safeParseDate, normalizeNationality, processName, processVictimStatus, findValue, determineGender, parseThaiDateToDate } = require("../utils/immigrantHelpers");

const connectionString = process.env.DATABASE_URL;
const isLocalhost = !connectionString || connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

const pool = new Pool({ connectionString, ssl: isLocalhost ? false : { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

if (!global.uploadProgress) {
  global.uploadProgress = {};
}

exports.getIllegalById = async (req, res) => {
  try {
    const data = await prisma.illegal_immigrants.findUnique({ where: { id: req.params.id } });
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.createIllegal = async (req, res) => {
  try {
    const data = req.body;
    if (!data.first_name_th || !data.last_name_th) return res.status(400).json({ success: false, message: "กรุณาระบุชื่อและนามสกุลภาษาไทย" });

    let photo_url = null;
    if (req.file) {
      const driveRes = await uploadToDrive(req.file, process.env.GOOGLE_DRIVE_FOLDER_ID);
      photo_url = driveRes.webViewLink;
    }

    const result = await prisma.illegal_immigrants.create({
      data: {
        first_name_th: data.first_name_th,
        middle_name_th: data.middle_name_th || null,
        last_name_th: data.last_name_th,
        first_name_en: data.first_name_en || null,
        middle_name_en: data.middle_name_en || null,
        last_name_en: data.last_name_en || null,
        passport_id: data.passport_id || null,
        gender: data.gender || null,
        nationality: data.nationality ? normalizeNationality(data.nationality) : null,
        detected_location: data.detected_location || "ไม่ระบุ",
        workplace: data.workplace || null,
        warrant: data.warrant || null,
        screening_details: data.screening_details || null,
        is_victim: data.is_victim === "true" || data.is_victim === true || false,
        detected_date: safeParseDate(data.detected_date),
        photo_url: photo_url
      }
    });
    res.status(201).json({ success: true, data: result, message: "บันทึกข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.updateIllegal = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingData = await prisma.illegal_immigrants.findUnique({ where: { id: id } });
    if (!existingData) return res.status(404).json({ success: false, message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });

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

    const result = await prisma.illegal_immigrants.update({
      where: { id: id },
      data: {
        first_name_th: data.first_name_th,
        middle_name_th: data.middle_name_th || null,
        last_name_th: data.last_name_th,
        first_name_en: data.first_name_en || null,
        middle_name_en: data.middle_name_en || null,
        last_name_en: data.last_name_en || null,
        passport_id: data.passport_id || null,
        gender: data.gender || null,
        nationality: data.nationality ? normalizeNationality(data.nationality) : null,
        detected_location: data.detected_location || "ไม่ระบุ",
        workplace: data.workplace || null,
        warrant: data.warrant || null,
        screening_details: data.screening_details || null,
        is_victim: data.is_victim === "true" || data.is_victim === true || false,
        detected_date: safeParseDate(data.detected_date),
        photo_url: photo_url
      }
    });
    res.status(200).json({ success: true, data: result, message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.deleteIllegal = async (req, res) => {
  try {
    const { id } = req.params;
    const existingData = await prisma.illegal_immigrants.findUnique({ where: { id: id } });
    
    if (existingData && existingData.photo_url) {
       const fileId = extractDriveFileId(existingData.photo_url);
       if(fileId) { try { await deleteFromDrive(fileId); } catch(e) { console.error(e); } }
    }
    await prisma.illegal_immigrants.delete({ where: { id: id } });
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

    let successCount = 0;
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
         let existingIllegal = null;
         if (passport_id) {
             existingIllegal = await prisma.illegal_immigrants.findFirst({
                 where: { passport_id: passport_id }
             });
         }

         const dataPayload = {
            first_name_th: hasName && isThai && fname ? fname : "ไม่ระบุ",
            middle_name_th: isThai ? mname : null,
            last_name_th: hasName && isThai && lname ? lname : "ไม่ระบุ",
            first_name_en: hasName && !isThai ? fname || null : null,
            middle_name_en: !isThai ? mname : null,
            last_name_en: hasName && !isThai ? lname || null : null,
            nationality: findValue(row, "สัญชาติ") ? normalizeNationality(findValue(row, "สัญชาติ")) : null, 
            passport_id: passport_id,
            detected_location: findValue(row, "สถานที่ตรวจพบ") ? String(findValue(row, "สถานที่ตรวจพบ")) : "ไม่ระบุ",
            workplace: findValue(row, "สถานที่ทำงาน") ? String(findValue(row, "สถานที่ทำงาน")) : null,
            warrant: findValue(row, "หมายจับ") ? String(findValue(row, "หมายจับ")) : null,
            gender: determineGender(row, prefix),
            detected_date: parseThaiDateToDate(row._sheetName),
            is_victim: isVictim,
            screening_details: details,
         };

         if (existingIllegal) {
             await prisma.illegal_immigrants.update({
                 where: { id: existingIllegal.id },
                 data: dataPayload
             });
         } else {
             await prisma.illegal_immigrants.create({
                 data: dataPayload
             });
         }
         successCount++;
      } catch (dbErr) {
         errors.push(`แถวที่ ${i+1}: ${dbErr.message}`);
      }

      if (jobId && global.uploadProgress[jobId]) {
         global.uploadProgress[jobId].current = i + 1;
      }
    }

    if (jobId && global.uploadProgress[jobId]) global.uploadProgress[jobId].status = 'completed';

    res.status(200).json({ 
        success: true, 
        message: `บันทึกข้อมูลแอบเข้าสำเร็จ ${successCount} จาก ${allJsonData.length} รายการ`,
        errors: errors.length > 0 ? errors : undefined 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการอ่านไฟล์และบันทึกข้อมูล" });
  }
};