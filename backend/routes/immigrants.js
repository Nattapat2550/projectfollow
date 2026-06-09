const express = require("express");
const upload = require("../middleware/upload");
const {
  getAllData,
  createIllegal,
  createDeported,
} = require("../controllers/immigrantController");

const router = express.Router();

router.get("/", getAllData);

// แอบเข้า (ไม่มีรูป)
router.post("/illegal", createIllegal);

// ส่งกลับ (อัปโหลดรูปผ่านฟิลด์ชื่อ 'photo')
router.post("/deported", upload.single("photo"), createDeported);

// เส้นทางสำหรับอัปโหลด Excel
router.post("/upload-excel", upload.single("file"), (req, res) => {
    res.status(200).json({ success: true, message: "อัปโหลดไฟล์เรียบร้อย รอประมวลผล" });
});

module.exports = router;