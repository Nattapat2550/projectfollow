const multer = require("multer");
const path = require("path");
const fs = require("fs");

// สร้างโฟลเดอร์อัตโนมัติหากไม่มี
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // ตั้งชื่อไฟล์: วันที่-ชื่อไฟล์เดิม
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;