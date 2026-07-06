import express from "express";
const router = express.Router();
import multer from "multer";

import { getAllData, getDashboardData } from "@/handler/all";
import {
	createIllegal,
	deleteIllegal,
	getIllegalById,
	getUploadProgress,
	updateIllegal,
	uploadExcelIllegal,
} from "@/handler/illegal";

import * as repatriatedController from "../controllers/repatriated";
// 🟢 เพิ่มนำเข้า Middleware protect เพื่อเช็ค User จาก Token
import { protect } from "../middleware/auth";
import uploadMiddleware from "../middleware/upload";

const memoryStorage = multer.memoryStorage();
const uploadExcel = multer({ storage: memoryStorage });

// ----------------------------------------------------
// ข้อมูลรวม & Dashboard
// ----------------------------------------------------
router.get("/", getAllData);
router.get("/dashboard", getDashboardData);

// ----------------------------------------------------
// Illegal (แอบเข้าเมือง)
// ----------------------------------------------------
router.get("/illegal/:id", getIllegalById);
// 🟢 ใส่ protect เข้าไปก่อนหน้าฟังก์ชัน controller
router.post(
	"/illegal",
	protect,
	uploadMiddleware.fields([
		{ name: "photo", maxCount: 1 },
		{ name: "passport_photo", maxCount: 1 },
	]),
	createIllegal
);
router.put(
	"/illegal/:id",
	protect,
	uploadMiddleware.fields([
		{ name: "photo", maxCount: 1 },
		{ name: "passport_photo", maxCount: 1 },
	]),
	updateIllegal
);
router.delete("/illegal/:id", protect, deleteIllegal);

// ระบบ Excel อัปโหลดและตรวจสอบ Progress
// 🟢 ใส่ protect เข้าไปที่ระบบอัปโหลด Excel
router.post(
	"/upload-excel-illegal",
	protect,
	uploadExcel.single("file"),
	uploadExcelIllegal
);
router.get("/upload-progress/:jobId", getUploadProgress);

// ----------------------------------------------------
// Repatriated (ส่งกลับ)
// ----------------------------------------------------
router.get("/repatriated/:id", repatriatedController.getRepatriatedById);
router.post(
	"/repatriated",
	protect,
	uploadMiddleware.fields([
		{ name: "photo", maxCount: 1 },
		{ name: "passport_photo", maxCount: 1 },
	]),
	repatriatedController.createRepatriated
);
router.put(
	"/repatriated/:id",
	protect,
	uploadMiddleware.fields([
		{ name: "photo", maxCount: 1 },
		{ name: "passport_photo", maxCount: 1 },
	]),
	repatriatedController.updateRepatriated
);
router.delete(
	"/repatriated/:id",
	protect,
	repatriatedController.deleteRepatriated
);

export default router;
