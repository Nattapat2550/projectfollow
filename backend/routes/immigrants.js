const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const immigrantController = require("../controllers/immigrantController");

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี (ป้องกัน Error ตอนเซฟรูป)
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ----------------------------------------------------
// ตั้งค่า Multer #1: สำหรับอัปโหลดรูปภาพ (เก็บไฟล์ลง Disk)
// ----------------------------------------------------
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // บันทึกในโฟลเดอร์ uploads
  },
  filename: function (req, file, cb) {
    // เปลี่ยนชื่อไฟล์เป็น timestamp เพื่อป้องกันชื่อซ้ำ
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const uploadPhoto = multer({ storage: diskStorage });


// ----------------------------------------------------
// ตั้งค่า Multer #2: สำหรับอัปโหลด Excel (เก็บใน Memory)
// ----------------------------------------------------
const memoryStorage = multer.memoryStorage();
const uploadExcel = multer({ storage: memoryStorage });


// ----------------------------------------------------
// Routes
// ----------------------------------------------------

// GET: ดึงข้อมูลทั้งหมด
router.get("/", immigrantController.getAllData);

// POST: เพิ่มข้อมูลแอบเข้า (รายคน)
router.post("/illegal", immigrantController.createIllegal);

// POST: เพิ่มข้อมูลส่งกลับ (รายคน พร้อมรูปภาพ)
// ใช้ uploadPhoto.single("photo") รับรูปจากฟิลด์ที่ชื่อ photo
router.post("/deported", uploadPhoto.single("photo"), immigrantController.createDeported);

// POST: อัปโหลดข้อมูลผ่านไฟล์ Excel (แอบเข้า)
// ใช้ uploadExcel.single("file") รับไฟล์จากฟิลด์ที่ชื่อ file
router.post("/upload-excel-illegal", uploadExcel.single("file"), immigrantController.uploadExcelIllegal);

module.exports = router;