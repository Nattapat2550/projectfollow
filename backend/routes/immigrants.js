const express = require("express");
const router = express.Router();
const multer = require("multer");
const immigrantController = require("../controllers/immigrantController");

// นำเข้า Middleware จัดการไฟล์อัปโหลดส่วนกลางที่มีอยู่แล้วในระบบมาใช้ร่วมกัน
const uploadMiddleware = require("../middleware/upload");

// ตั้งค่า Multer สำหรับอัปโหลด Excel (ใช้เก็บใน Memory สำหรับส่งไปประมวลผลต่อ)
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
// ปรับมาใช้ uploadMiddleware จากส่วนกลางเพื่อความเป็นระเบียบและลดการซ้ำซ้อนของโฟลเดอร์
router.post("/deported", uploadMiddleware.single("photo"), immigrantController.createDeported);

// POST: อัปโหลดข้อมูลผ่านไฟล์ Excel (แอบเข้า)
router.post("/upload-excel-illegal", uploadExcel.single("file"), immigrantController.uploadExcelIllegal);

module.exports = router;