// backend/controllers/deportedController.js

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { uploadToDrive, deleteFromDrive, extractDriveFileId } = require("../services/googleDriveService");
const { safeParseDate } = require("../utils/immigrantHelpers");

const connectionString = process.env.DATABASE_URL;
const isLocalhost = !connectionString || connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

const pool = new Pool({ connectionString, ssl: isLocalhost ? false : { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

exports.getDeportedById = async (req, res) => {
  try {
    const data = await prisma.deported_persons.findUnique({ where: { id: req.params.id } });
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.createDeported = async (req, res) => {
  try {
    const data = req.body;
    if (!data.first_name_th || !data.last_name_th || !data.national_id) return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบถ้วน" });

    if (data.national_id) {
      const existing = await prisma.deported_persons.findUnique({ where: { national_id: data.national_id } });
      if (existing) return res.status(400).json({ success: false, message: "เลขประจำตัว (national_id) นี้มีอยู่ในระบบแล้ว" });
    }

    if (data.passport_id) {
      const existing = await prisma.deported_persons.findUnique({ where: { passport_id: data.passport_id } });
      if (existing) return res.status(400).json({ success: false, message: "เลขหนังสือเดินทาง (passport_id) นี้มีอยู่ในระบบแล้ว" });
    }

    let photo_url = null;
    if (req.file) {
      const driveRes = await uploadToDrive(req.file, process.env.GOOGLE_DRIVE_FOLDER_ID);
      photo_url = driveRes.webViewLink;
    }

    const result = await prisma.deported_persons.create({
      data: {
        first_name_th: data.first_name_th,
        middle_name_th: data.middle_name_th || null,
        last_name_th: data.last_name_th,
        first_name_en: data.first_name_en || null,
        middle_name_en: data.middle_name_en || null,
        last_name_en: data.last_name_en || null,
        date_of_birth: safeParseDate(data.date_of_birth),
        national_id: data.national_id,
        passport_id: data.passport_id || null,
        gender: data.gender || null,
        address: data.address || "ไม่ระบุ",
        channel: data.channel || null,
        result: data.result || "PENDING",
        number_of_case: parseInt(data.number_of_case) || 0,
        number_of_warrant: parseInt(data.number_of_warrant) || 0,
        age: parseInt(data.age) || null,
        return_date: safeParseDate(data.return_date),
        photo_url: photo_url,
      }
    });
    res.status(201).json({ success: true, data: result, message: "บันทึกข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.updateDeported = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const existingData = await prisma.deported_persons.findUnique({ where: { id: id } });
    if (!existingData) return res.status(404).json({ success: false, message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });

    let photo_url = existingData.photo_url;
    if (req.file) {
      if (existingData.photo_url) {
        const oldFileId = extractDriveFileId(existingData.photo_url);
        if (oldFileId) { try { await deleteFromDrive(oldFileId); } catch (e) { } }
      }
      const driveRes = await uploadToDrive(req.file, process.env.GOOGLE_DRIVE_FOLDER_ID);
      photo_url = driveRes.webViewLink;
    }

    const result = await prisma.deported_persons.update({
      where: { id: id },
      data: {
        first_name_th: data.first_name_th,
        middle_name_th: data.middle_name_th || null,
        last_name_th: data.last_name_th,
        first_name_en: data.first_name_en || null,
        middle_name_en: data.middle_name_en || null,
        last_name_en: data.last_name_en || null,
        date_of_birth: safeParseDate(data.date_of_birth),
        national_id: data.national_id,
        passport_id: data.passport_id || null,
        gender: data.gender || null,
        address: data.address || "ไม่ระบุ",
        channel: data.channel || null,
        result: data.result || "PENDING",
        number_of_case: parseInt(data.number_of_case) || 0,
        number_of_warrant: parseInt(data.number_of_warrant) || 0,
        age: parseInt(data.age) || null,
        return_date: safeParseDate(data.return_date),
        photo_url: photo_url
      }
    });
    res.status(200).json({ success: true, data: result, message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.deleteDeported = async (req, res) => {
  try {
    const { id } = req.params;
    const existingData = await prisma.deported_persons.findUnique({ where: { id: id } });
    if (existingData && existingData.photo_url) {
       const fileId = extractDriveFileId(existingData.photo_url);
       if(fileId) { try { await deleteFromDrive(fileId); } catch(e) {} }
    }
    await prisma.deported_persons.delete({ where: { id: id } });
    res.status(200).json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};