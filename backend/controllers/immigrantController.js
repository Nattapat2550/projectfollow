const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const xlsx = require("xlsx");

const connectionString = process.env.DATABASE_URL;
const isLocalhost = !connectionString || connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

const pool = new Pool({ connectionString, ssl: isLocalhost ? false : { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ================= ฟังก์ชันช่วยเหลือ (Helpers) =================

const parseThaiDateToDate = (text) => {
  if (!text) return null;
  const thaiMonths = { "ม.ค.": "01", "ก.พ.": "02", "มี.ค.": "03", "เม.ย.": "04", "พ.ค.": "05", "มิ.ย.": "06", "ก.ค.": "07", "ส.ค.": "08", "ก.ย.": "09", "ต.ค.": "10", "พ.ย.": "11", "ธ.ค.": "12" };
  const match = String(text).match(/(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(\d{2})/);
  if (!match) return null;
  const year = parseInt(match[2]) + 2500 - 543;
  return new Date(`${year}-${thaiMonths[match[1]]}-01T00:00:00Z`);
};

const findValue = (rowObj, keyword) => {
  const cleanStr = (str) => str.replace(/[\s\-\–\—\_]+/g, '');
  const cleanKeyword = cleanStr(keyword);
  let matchedKey = Object.keys(rowObj).find(k => cleanStr(k) === cleanKeyword) || Object.keys(rowObj).find(k => cleanStr(k).includes(cleanKeyword));
  return matchedKey ? rowObj[matchedKey] : null;
};

const processName = (rawFullName) => {
  let cleanFullName = String(rawFullName).trim();
  const prefixRegex = /^(นาย|นางสาว|นาง|น\.ส\.|น\.ส|ด\.ช\.|ด\.ญ\.|ด\.ช|ด\.ญ|Mr\.|Mrs\.|Ms\.|Miss\.|Master\.|Mr|Mrs|Ms|Miss|Master)\s*/i;
  const matchPrefix = cleanFullName.match(prefixRegex);
  
  const prefix = matchPrefix ? matchPrefix[1].trim() : "";
  if (matchPrefix) cleanFullName = cleanFullName.substring(matchPrefix[0].length).trim();

  const parts = cleanFullName.split(/\s+/).filter(p => p !== "");
  const fname = parts[0] || "";
  const mname = parts.length >= 3 ? parts[1] : null;
  const lname = parts.length === 2 ? parts[1] : parts.length >= 3 ? parts.slice(2).join(" ") : "";
  const isThai = /[ก-๙]/.test(cleanFullName);

  return { prefix, fname, mname, lname, isThai, hasName: !!(fname || lname) };
};

const processVictimStatus = (row) => {
  const rawScreening = findValue(row, "ผลการคัดกรอง") || findValue(row, "เป็นผู้เสียหาย");
  const screeningStr = rawScreening != null ? String(rawScreening).trim() : "";
  const isNotEmpty = screeningStr !== "" && !["-", "–", "—"].includes(screeningStr);

  if (isNotEmpty) return { isVictim: true, details: screeningStr };

  const emptyKey = Object.keys(row).find(k => k.startsWith("__EMPTY") && row[k] != null && String(row[k]).trim() !== "" && !["-", "–", "—"].includes(String(row[k]).trim()));
  return { isVictim: false, details: emptyKey ? String(row[emptyKey]).trim() : "ไม่เป็นผู้เสียหาย (ไม่มีข้อความอธิบายในไฟล์)" };
};

const determineGender = (row, prefix) => {
  let gender = findValue(row, "เพศ") || findValue(row, "Gender");
  if (!gender && prefix) {
    const p = prefix.toLowerCase();
    if (["นาย", "ด.ช.", "ด.ช", "mr", "mr.", "master", "master.", "boy", "mister"].includes(p)) return "ชาย";
    if (["นาง", "นางสาว", "น.ส.", "น.ส", "ด.ญ.", "ด.ญ", "miss", "miss.", "mrs", "mrs.", "ms", "ms.", "girl"].includes(p)) return "หญิง";
  }
  return gender || null;
};

// ================= คอนโทรลเลอร์ (Controllers) หลัก =================

exports.getAllData = async (req, res) => {
  try {
    const [illegals, deporteds] = await Promise.all([
      prisma.illegal_immigrants.findMany({ orderBy: { id: "desc" } }),
      prisma.deported_persons.findMany({ orderBy: { id: "desc" } })
    ]);
    res.status(200).json({ success: true, data: { illegals, deporteds } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// -------- แอบเข้าเมือง (Illegal) --------

exports.createIllegal = async (req, res) => {
  try {
    const data = req.body;

    if (!data.first_name_th || !data.last_name_th) {
      return res.status(400).json({ 
        success: false, 
        message: "กรุณาระบุชื่อและนามสกุลภาษาไทย (first_name_th, last_name_th)" 
      });
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
        nationality: data.nationality || null,
        detected_location: data.detected_location || "ไม่ระบุ",
        workplace: data.workplace || null,
        warrant: data.warrant || null,
        screening_details: data.screening_details || null,
        is_victim: data.is_victim === "true" || data.is_victim === true || false,
        detected_date: data.detected_date ? new Date(data.detected_date) : null
      }
    });
    res.status(201).json({ success: true, data: result, message: "บันทึกข้อมูลแอบเข้าสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.updateIllegal = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const result = await prisma.illegal_immigrants.update({
      where: { id: parseInt(id) },
      data: {
        first_name_th: data.first_name_th,
        middle_name_th: data.middle_name_th || null,
        last_name_th: data.last_name_th,
        first_name_en: data.first_name_en || null,
        middle_name_en: data.middle_name_en || null,
        last_name_en: data.last_name_en || null,
        passport_id: data.passport_id || null,
        gender: data.gender || null,
        nationality: data.nationality || null,
        detected_location: data.detected_location || "ไม่ระบุ",
        workplace: data.workplace || null,
        warrant: data.warrant || null,
        screening_details: data.screening_details || null,
        is_victim: data.is_victim === "true" || data.is_victim === true || false,
        detected_date: data.detected_date ? new Date(data.detected_date) : null
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
    await prisma.illegal_immigrants.delete({
      where: { id: parseInt(id) }
    });
    res.status(200).json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

// -------- ส่งกลับ (Deported) --------

exports.createDeported = async (req, res) => {
  try {
    const data = req.body;

    if (!data.first_name_th || !data.last_name_th || !data.date_of_birth || !data.national_id) {
      return res.status(400).json({ 
        success: false, 
        message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" 
      });
    }

    if (data.national_id) {
      const existingNational = await prisma.deported_persons.findUnique({ where: { national_id: data.national_id } });
      if (existingNational) return res.status(400).json({ success: false, message: "เลขประจำตัว (national_id) นี้มีอยู่ในระบบแล้ว" });
    }

    if (data.passport_id) {
      const existingPassport = await prisma.deported_persons.findUnique({ where: { passport_id: data.passport_id } });
      if (existingPassport) return res.status(400).json({ success: false, message: "เลขหนังสือเดินทาง (passport_id) นี้มีอยู่ในระบบแล้ว" });
    }

    const result = await prisma.deported_persons.create({
      data: {
        first_name_th: data.first_name_th,
        middle_name_th: data.middle_name_th || null,
        last_name_th: data.last_name_th,
        first_name_en: data.first_name_en || null,
        middle_name_en: data.middle_name_en || null,
        last_name_en: data.last_name_en || null,
        date_of_birth: new Date(data.date_of_birth),
        national_id: data.national_id,
        passport_id: data.passport_id || null,
        address: data.address || "ไม่ระบุ",
        channel: data.channel || null,
        result: data.result || "PENDING",
        number_of_case: parseInt(data.number_of_case) || 0,
        number_of_warrant: parseInt(data.number_of_warrant) || 0,
        age: parseInt(data.age) || null,
        return_date: data.return_date ? new Date(data.return_date) : null,
        photo_url: req.file ? `/uploads/${req.file.filename}` : null,
      }
    });
    res.status(201).json({ success: true, data: result, message: "บันทึกข้อมูลส่งกลับสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.updateDeported = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateData = {
      first_name_th: data.first_name_th,
      middle_name_th: data.middle_name_th || null,
      last_name_th: data.last_name_th,
      first_name_en: data.first_name_en || null,
      middle_name_en: data.middle_name_en || null,
      last_name_en: data.last_name_en || null,
      date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
      national_id: data.national_id,
      passport_id: data.passport_id || null,
      address: data.address || "ไม่ระบุ",
      channel: data.channel || null,
      result: data.result || "PENDING",
      number_of_case: parseInt(data.number_of_case) || 0,
      number_of_warrant: parseInt(data.number_of_warrant) || 0,
      age: parseInt(data.age) || null,
      return_date: data.return_date ? new Date(data.return_date) : null,
    };

    if (req.file) {
      updateData.photo_url = `/uploads/${req.file.filename}`;
    }

    const result = await prisma.deported_persons.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    res.status(200).json({ success: true, data: result, message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.deleteDeported = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.deported_persons.delete({
      where: { id: parseInt(id) }
    });
    res.status(200).json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};


// ================= อัปโหลด Excel (Upload Excel) =================

if (!global.uploadProgress) {
  global.uploadProgress = {};
}

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

    if (allJsonData.length === 0) return res.status(400).json({ success: false, message: "ไม่พบข้อมูลในไฟล์ Excel" });

    if (action === "preview") {
      const preview_data = [];
      for (let i = 0; i < allJsonData.length; i++) {
        const row = allJsonData[i];
        const rawFullName = findValue(row, "ชื่อสกุล") || findValue(row, "ชื่อ") || "";
        const { prefix, fname, mname, lname, isThai, hasName } = processName(rawFullName);
        const { isVictim, details } = processVictimStatus(row);
        
        let dateObj = parseThaiDateToDate(row._sheetName);

        preview_data.push({
          ลำดับที่อ่านได้: i + 1,
          first_name_th: hasName && isThai && fname ? fname : "ไม่ระบุ",
          middle_name_th: isThai ? mname : null,
          last_name_th: hasName && isThai && lname ? lname : "ไม่ระบุ",
          first_name_en: hasName && !isThai ? fname || null : null,
          middle_name_en: !isThai ? mname : null,
          last_name_en: hasName && !isThai ? lname || null : null,
          nationality: findValue(row, "สัญชาติ") ? String(findValue(row, "สัญชาติ")) : null,
          passport_id: findValue(row, "เลขหนังสือเดินทาง") || findValue(row, "Passport") ? String(findValue(row, "เลขหนังสือเดินทาง") || findValue(row, "Passport")) : null,
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
      return res.status(200).json({ success: true, message: "ดึงข้อมูลพรีวิวสำเร็จ (ยังไม่ได้บันทึก)", total_rows: preview_data.length, preview_data });
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

      try {
         await prisma.illegal_immigrants.create({
            data: {
                first_name_th: hasName && isThai && fname ? fname : "ไม่ระบุ",
                middle_name_th: isThai ? mname : null,
                last_name_th: hasName && isThai && lname ? lname : "ไม่ระบุ",
                first_name_en: hasName && !isThai ? fname || null : null,
                middle_name_en: !isThai ? mname : null,
                last_name_en: hasName && !isThai ? lname || null : null,
                nationality: findValue(row, "สัญชาติ") ? String(findValue(row, "สัญชาติ")) : null,
                passport_id: findValue(row, "เลขหนังสือเดินทาง") || findValue(row, "Passport") ? String(findValue(row, "เลขหนังสือเดินทาง") || findValue(row, "Passport")) : null,
                detected_location: findValue(row, "สถานที่ตรวจพบ") ? String(findValue(row, "สถานที่ตรวจพบ")) : "ไม่ระบุ",
                workplace: findValue(row, "สถานที่ทำงาน") ? String(findValue(row, "สถานที่ทำงาน")) : null,
                warrant: findValue(row, "หมายจับ") ? String(findValue(row, "หมายจับ")) : null,
                gender: determineGender(row, prefix),
                detected_date: parseThaiDateToDate(row._sheetName),
                is_victim: isVictim,
                screening_details: details,
            }
         });
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