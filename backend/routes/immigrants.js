const express = require("express");
const router = express.Router();
const multer = require("multer");
const immigrantController = require("../controllers/immigrantController");

const uploadMiddleware = require("../middleware/upload");

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
router.post("/deported", uploadMiddleware.single("photo"), immigrantController.createDeported);

// POST: อัปโหลดข้อมูลผ่านไฟล์ Excel (แอบเข้า)
router.post("/upload-excel-illegal", uploadExcel.single("file"), immigrantController.uploadExcelIllegal);

// GET: เช็ค Progress การอัปโหลด
router.get("/upload-progress/:jobId", immigrantController.getUploadProgress);

module.exports = router;