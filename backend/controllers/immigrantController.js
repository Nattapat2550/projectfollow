const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const xlsx = require("xlsx");

// ดึง DATABASE_URL จากไฟล์ .env
const connectionString = process.env.DATABASE_URL;

// เช็คว่าถ้าไม่ใช่ Localhost ให้บังคับใช้ SSL (สำหรับ Render)
const isLocalhost = !connectionString || connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

// สร้าง Pool การเชื่อมต่อ พร้อมตั้งค่า SSL
const pool = new Pool({ 
  connectionString: connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false } 
});

// สร้าง Adapter ของ Prisma
const adapter = new PrismaPg(pool);

// เรียกใช้ Prisma โดยบังคับให้มันใช้ Adapter ตัวนี้
const prisma = new PrismaClient({ adapter });

// 1. ดึงข้อมูลทั้งหมด
exports.getAllData = async (req, res) => {
  try {
    const illegals = await prisma.illegal_immigrants.findMany({
      orderBy: { id: "desc" },
    });
    const deporteds = await prisma.deported_persons.findMany({
      orderBy: { id: "desc" },
    });

    res.status(200).json({
      success: true,
      data: {
        illegals,
        deporteds,
      },
    });
  } catch (err) {
    console.error("Get All Data Error:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 2. สร้างข้อมูลแอบเข้า (เพิ่มรายบุคคล)
exports.createIllegal = async (req, res) => {
  try {
    const data = req.body;

    const result = await prisma.illegal_immigrants.create({
      data: {
        first_name_th: data.first_name_th,
        middle_name_th: data.middle_name_th || null,
        last_name_th: data.last_name_th,
        first_name_en: data.first_name_en || null,
        middle_name_en: data.middle_name_en || null,
        last_name_en: data.last_name_en || null,
        nationality: data.nationality || null,
        passport_id: data.passport_id || null,
        detected_location: data.detected_location,
        is_victim: data.is_victim === "true" || data.is_victim === true,
        gender: data.gender || null,
        detected_date: data.detected_date ? new Date(data.detected_date) : null,
        warrant: data.warrant || null,
        workplace: data.workplace || null,
      },
    });

    res.status(201).json({ success: true, data: result, message: "บันทึกข้อมูลแอบเข้าสำเร็จ" });
  } catch (err) {
    console.error("Create Illegal Error:", err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

// 3. สร้างข้อมูลส่งกลับ (เพิ่มรายบุคคล พร้อมรูปถ่าย)
exports.createDeported = async (req, res) => {
  try {
    const data = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await prisma.deported_persons.create({
      data: {
        first_name_th: data.first_name_th,
        middle_name_th: data.middle_name_th || null,
        last_name_th: data.last_name_th,
        first_name_en: data.first_name_en || null,
        middle_name_en: data.middle_name_en || null,
        last_name_en: data.last_name_en || null,
        date_of_birth: data.date_of_birth,
        national_id: data.national_id,
        passport_id: data.passport_id || null,
        address: data.address,
        number_of_case: parseInt(data.number_of_case) || 0,
        number_of_warrant: parseInt(data.number_of_warrant) || 0,
        photo_url: photoUrl,
        age: parseInt(data.age) || null,
        return_date: data.return_date ? new Date(data.return_date) : null,
        channel: data.channel || null,
      },
    });

    res.status(201).json({ success: true, data: result, message: "บันทึกข้อมูลส่งกลับสำเร็จ" });
  } catch (err) {
    console.error("Create Deported Error:", err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

// 4. นำเข้าข้อมูลแอบเข้า ผ่านไฟล์ Excel (ทดสอบอ่านไฟล์และหัวคอลัมน์ ยังไม่ลง DB)
exports.uploadExcelIllegal = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "กรุณาอัปโหลดไฟล์ Excel" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    
    let allJsonData = [];
    let allHeaders = new Set(); 
    
    // วนลูปอ่านข้อมูลจาก "ทุก Sheet"
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = xlsx.utils.sheet_to_json(worksheet, { defval: null });
      
      if (sheetData.length > 0) {
        Object.keys(sheetData[0]).forEach(k => allHeaders.add(k));
        const dataWithSheetName = sheetData.map(row => ({
          ...row,
          _sheetName: sheetName
        }));
        allJsonData = allJsonData.concat(dataWithSheetName);
      }
    });

    if (allJsonData.length === 0) {
      return res.status(400).json({ success: false, message: "ไม่พบข้อมูลในไฟล์ Excel" });
    }

    // ---------------------------------------------------------
    // แก้บัค: ฟังก์ชันค้นหาหัวคอลัมน์ (ลบช่องว่าง และ ขีด ทุกชนิด)
    // ---------------------------------------------------------
    const findValue = (rowObj, keyword) => {
      // ใช้ Regex ตัดช่องว่าง (\s) และเครื่องหมายขีดทุกประเภท (-, –, —, _) ออกไปให้หมด
      const cleanStr = (str) => str.replace(/[\s\-\–\—\_]+/g, ''); 
      const cleanKeyword = cleanStr(keyword); // ตัวค้นหาก็ต้องถูกตัดขีดออกด้วย
      
      const matchedKey = Object.keys(rowObj).find(k => {
        return cleanStr(k).includes(cleanKeyword); // เทียบคำที่ถูกจับติดกันแล้ว
      });
      return matchedKey ? rowObj[matchedKey] : null;
    };

    // Map ข้อมูลตามหัวคอลัมน์
    const formattedData = allJsonData.map((row, index) => {
      // 1. จัดการแยก ชื่อ-สกุล (หาคำว่า "ชื่อสกุล" โดยไม่ต้องสนว่า Excel จะพิมพ์ขีดมาแบบไหน)
      const fullName = findValue(row, "ชื่อสกุล") || findValue(row, "ชื่อ") || "";
      const nameParts = String(fullName).trim().split(/\s+/);
      
      // ถ้ามีข้อมูล fullName ค่อยดึงช่องแรกเป็นชื่อ ถ้าไม่มีให้เป็น "ไม่ระบุ"
      const firstName = fullName ? (nameParts[0] || "ไม่ระบุ") : "ไม่ระบุ";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "ไม่ระบุ";

      // 2. จัดการเรื่อง ผลการคัดกรอง
      const isVictim = findValue(row, "เป็นผู้เสียหาย") ? true : false;

      // 3. ค้นหาข้อมูลอื่นๆ 
      const nationality = findValue(row, "สัญชาติ");
      const passportId = findValue(row, "เลขหนังสือเดินทาง") || findValue(row, "Passport");
      const detectedLocation = findValue(row, "สถานที่ตรวจพบ");
      const workplace = findValue(row, "สถานที่ทำงาน");

      return {
        ลำดับที่อ่านได้: index + 1,
        ชื่อชีต: row._sheetName,
        first_name_th: firstName,
        last_name_th: lastName,
        nationality: nationality ? String(nationality) : null,
        passport_id: passportId ? String(passportId) : null,
        detected_location: detectedLocation || "ไม่ระบุ",
        workplace: workplace || null,
        is_victim: isVictim,
        
        raw_data_from_excel: row
      };
    });

    res.status(200).json({
      success: true,
      message: "อ่านไฟล์จากทุก Sheet และจัดรูปแบบข้อมูลสำเร็จ",
      total_rows: formattedData.length,
      headers_found: Array.from(allHeaders),
      preview_data: formattedData
    });
    
  } catch (err) {
    console.error("Upload Excel Error:", err);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการอ่านไฟล์" });
  }
};