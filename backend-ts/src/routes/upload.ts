import express from "express";
const router = express.Router();
import rateLimit from "express-rate-limit";
import multer from "multer";

import { getUploadProgress, uploadExcel } from "@/handler/upload";

import { protect } from "../middleware/auth";

// 🟢 แก้ไขตรงนี้: ใช้ memoryStorage() เพื่อให้ Controller สามารถอ่าน req.file.buffer ได้
const upload = multer({ storage: multer.memoryStorage() });

// 🟢 สร้างตัวกันสแปม: ให้ยิงได้ไม่เกิน 10 ครั้งต่อ 15 นาที
const uploadLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 นาที
	max: 10, // จำกัด 10 ครั้งต่อ IP
	message: {
		success: false,
		message: "อัปโหลดบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
	},
});

// 🟢 ใส่ uploadLimiter ขวางไว้ก่อนเข้า protect
router.post(
	"/upload-excel",
	uploadLimiter,
	protect,
	upload.single("file"),
	uploadExcel
);

router.get("/upload-progress/:jobId", getUploadProgress);

export default router;
