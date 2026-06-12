const express = require("express");
const router = express.Router();
const multer = require("multer");
const testUpload2Controller = require("../controllers/testUpload2Controller");

const upload = multer({ dest: "uploads/" });

// เส้นทางสำหรับ Upload Excel
router.post("/upload-excel", upload.single("file"), testUpload2Controller.uploadExcel);

// GET: เช็ค Progress การอัปโหลด
router.get("/upload-progress/:jobId", testUpload2Controller.getUploadProgress);

module.exports = router;