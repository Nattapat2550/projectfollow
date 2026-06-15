// backend/routes/immigrants.js

const express = require("express");
const router = express.Router();
const multer = require("multer");

// นำเข้า Controller ที่แยกย่อยออกมาใหม่ตามโครงสร้างที่ออกแบบไว้
const immigrantController = require("../controllers/immigrantController");
const illegalController = require("../controllers/illegalController");
const deportedController = require("../controllers/deportedController");

const uploadMiddleware = require("../middleware/upload");

const memoryStorage = multer.memoryStorage();
const uploadExcel = multer({ storage: memoryStorage });

// ----------------------------------------------------
// ข้อมูลรวม & Dashboard (ใช้ immigrantController)
// ----------------------------------------------------
router.get("/", immigrantController.getAllData);
router.get("/dashboard", immigrantController.getDashboardData);

// ----------------------------------------------------
// Illegal (แอบเข้าเมือง) - (ใช้ illegalController)
// ----------------------------------------------------
router.get("/illegal/:id", illegalController.getIllegalById);
router.post("/illegal", uploadMiddleware.single("photo"), illegalController.createIllegal);
router.put("/illegal/:id", uploadMiddleware.single("photo"), illegalController.updateIllegal);
router.delete("/illegal/:id", illegalController.deleteIllegal);

// ระบบ Excel อัปโหลดและตรวจสอบ Progress
router.post("/upload-excel-illegal", uploadExcel.single("file"), illegalController.uploadExcelIllegal);
router.get("/upload-progress/:jobId", illegalController.getUploadProgress);

// ----------------------------------------------------
// Deported (ส่งกลับ) - (ใช้ deportedController)
// ----------------------------------------------------
router.get("/deported/:id", deportedController.getDeportedById);
router.post("/deported", uploadMiddleware.single("photo"), deportedController.createDeported);
router.put("/deported/:id", uploadMiddleware.single("photo"), deportedController.updateDeported);
router.delete("/deported/:id", deportedController.deleteDeported);

module.exports = router;