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

// 4. นำเข้าข้อมูลแอบเข้า ผ่านไฟล์ Excel
exports.uploadExcelIllegal = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "กรุณาอัปโหลดไฟล์ Excel" });
    }

    // อ่านไฟล์ Excel จาก Memory Buffer
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({ success: false, message: "ไม่พบข้อมูลในไฟล์ Excel" });
    }

    // Map ข้อมูลให้ตรงกับหัวคอลัมน์ภาษาไทยใน Excel
    const formattedData = jsonData.map((row) => {
      // 1. จัดการแยก ชื่อ-สกุล (สมมติว่าใน Excel พิมพ์มาเป็น "สมชาย รักดี" เว้นวรรคตรงกลาง)
      const fullName = row["ชื่อ-สกุล"] || "";
      const nameParts = fullName.trim().split(/\s+/); // แยกคำด้วยช่องว่าง
      const firstName = nameParts[0] || "ไม่ระบุ";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "ไม่ระบุ";

      // 2. จัดการเรื่อง ผลการคัดกรอง
      // ถ้ามีข้อมูลในคอลัมน์ "เป็นผู้เสียหาย" (เช่น พิมพ์ /, ใช่, 1) จะถือว่าเป็น true
      const isVictim = !!row["เป็นผู้เสียหาย"];

      return {
        first_name_th: firstName,
        middle_name_th: null,
        last_name_th: lastName,
        first_name_en: null,
        middle_name_en: null,
        last_name_en: null,
        nationality: row["สัญชาติ (เรียงตามสัญชาติ)"] ? String(row["สัญชาติ (เรียงตามสัญชาติ)"]) : null,
        passport_id: row["เลขหนังสือเดินทาง : Passport No. "] ? String(row["เลขหนังสือเดินทาง : Passport No. "]) : null,
        detected_location: row["สถานที่ตรวจพบ"] || "ไม่ระบุ",
        workplace: row["สถานที่ทำงาน"] || null,
        is_victim: isVictim,
        
        // คอลัมน์อื่นๆ ที่ไม่ได้มีในไฟล์ Excel รอบนี้ ให้มีค่าเป็น null ไปก่อน
        gender: null,
        detected_date: null,
        warrant: null,
      };
    });

    // บันทึกลงฐานข้อมูลรวดเดียวด้วย createMany (ข้ามข้อมูลที่ passport ซ้ำ)
    const result = await prisma.illegal_immigrants.createMany({
      data: formattedData,
      skipDuplicates: true,
    });

    res.status(201).json({
      success: true,
      message: `นำเข้าข้อมูลสำเร็จ จำนวน ${result.count} รายการ`,
    });
  } catch (err) {
    console.error("Upload Excel Error:", err);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการอ่านไฟล์" });
  }
};