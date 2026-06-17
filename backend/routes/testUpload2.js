const express = require("express");
const router = express.Router();
const multer = require("multer");
const testUpload2Controller = require("../controllers/testUpload2Controller");
// 🟢 1. นำเข้า protect
const { protect } = require("../middleware/auth");

const upload = multer({ dest: "uploads/" });

// 🟢 2. ใส่ protect เข้าไปเพื่อบังคับให้ต้องส่ง Token (เพื่อดึง req.user.id)
router.post("/upload-excel", protect, upload.single("file"), testUpload2Controller.uploadExcel);

// GET: เช็ค Progress การอัปโหลด
router.get("/upload-progress/:jobId", testUpload2Controller.getUploadProgress);

module.exports = router;