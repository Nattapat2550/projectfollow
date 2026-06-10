const express = require("express");
const router = express.Router();
const multer = require("multer");
const testUpload2Controller = require("../controllers/testUpload2Controller");

// ตั้งค่าที่เก็บไฟล์ชั่วคราว
const upload = multer({ dest: "uploads/" });

// เส้นทางสำหรับ Upload Excel (ตรงกับ URL ใน Frontend)
router.post("/upload-excel", upload.single("file"), testUpload2Controller.uploadExcel);

module.exports = router;