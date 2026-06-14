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

// POST: เพิ่มข้อมูลแอบเข้า (รายคน พร้อมรูปภาพ)
router.post("/illegal", uploadMiddleware.single("photo"), immigrantController.createIllegal);

// POST: เพิ่มข้อมูลส่งกลับ (รายคน พร้อมรูปภาพ)
router.post("/deported", uploadMiddleware.single("photo"), immigrantController.createDeported);

// PUT: แก้ไขข้อมูลแอบเข้า (รายคน พร้อมอัปเดตรูปภาพได้)
router.put("/illegal/:id", uploadMiddleware.single("photo"), immigrantController.updateIllegal);

// PUT: แก้ไขข้อมูลส่งกลับ (รายคน พร้อมอัปเดตรูปภาพได้)
router.put("/deported/:id", uploadMiddleware.single("photo"), immigrantController.updateDeported);

// DELETE: ลบข้อมูลแอบเข้า
router.delete("/illegal/:id", immigrantController.deleteIllegal);

// DELETE: ลบข้อมูลส่งกลับ
router.delete("/deported/:id", immigrantController.deleteDeported);

// POST: อัปโหลดข้อมูลผ่านไฟล์ Excel (แอบเข้า)
router.post("/upload-excel-illegal", uploadExcel.single("file"), immigrantController.uploadExcelIllegal);

// GET: เช็ค Progress การอัปโหลด
router.get("/upload-progress/:jobId", immigrantController.getUploadProgress);

router.get("/dashboard", immigrantController.getDashboardData);

module.exports = router;