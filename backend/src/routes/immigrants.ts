import express from "express";
const router = express.Router();
import multer from "multer";

import * as illegalController from "../controllers/uploadExcelIllegalController";
import * as illegal from "../handler/illegal";
import * as repatriated from "../handler/repatriated";

import uploadMiddleware from "../middleware/upload";
// 🟢 เพิ่มนำเข้า Middleware protect เพื่อเช็ค User จาก Token
import { protect } from "../middleware/auth";

const memoryStorage = multer.memoryStorage();
const uploadExcel = multer({ storage: memoryStorage });

// ----------------------------------------------------
// Illegal (แอบเข้าเมือง)
// ----------------------------------------------------
router.get("/illegal", protect, illegal.getAllIllegal);
router.get("/illegal/:id", protect, illegal.getIllegalById);
router.post(
  "/illegal",
  protect,
  uploadMiddleware.fields([
    { name: "photo", maxCount: 1 },
    { name: "passport_photo", maxCount: 1 },
  ]),
  illegal.createIllegal,
);
router.put(
  "/illegal/:id",
  protect,
  uploadMiddleware.fields([
    { name: "photo", maxCount: 1 },
    { name: "passport_photo", maxCount: 1 },
  ]),
  illegal.updateIllegal,
);
router.delete("/illegal/:id", protect, illegal.deleteIllegal);

// ระบบ Excel อัปโหลดและตรวจสอบ Progress
// 🟢 ใส่ protect เข้าไปที่ระบบอัปโหลด Excel
router.post(
  "/upload-excel-illegal",
  protect,
  uploadExcel.single("file"),
  illegalController.uploadExcelIllegal,
);
router.get("/upload-progress/:jobId", illegalController.getUploadProgress);

// ----------------------------------------------------
// Repatriated (ส่งกลับ)
// ----------------------------------------------------
router.get("/repatriated", protect, repatriated.getAllRepatriated);
router.get("/repatriated/:id", protect, repatriated.getRepatriatedById);
router.post(
  "/repatriated",
  protect,
  uploadMiddleware.fields([
    { name: "photo", maxCount: 1 },
    { name: "passport_photo", maxCount: 1 },
  ]),
  repatriated.createRepatriated,
);
router.put(
  "/repatriated/:id",
  protect,
  uploadMiddleware.fields([
    { name: "photo", maxCount: 1 },
    { name: "passport_photo", maxCount: 1 },
  ]),
  repatriated.updateRepatriated,
);
router.delete("/repatriated/:id", protect, repatriated.deleteRepatriated);

export default router;
