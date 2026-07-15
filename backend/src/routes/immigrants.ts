import express from "express";
const router = express.Router();
import multer from "multer";

// นำเข้า Controller
import * as immigrantController from "../controllers/immigrantController";
import * as illegalController from "../controllers/illegalController";
import * as repatriated from "../handler/repatriated";

import uploadMiddleware from "../middleware/upload";
// 🟢 เพิ่มนำเข้า Middleware protect เพื่อเช็ค User จาก Token
import { protect } from "../middleware/auth";

const memoryStorage = multer.memoryStorage();
const uploadExcel = multer({ storage: memoryStorage });

// ----------------------------------------------------
// ข้อมูลรวม & Dashboard
// ----------------------------------------------------
router.get("/", immigrantController.getAllData);
router.get("/dashboard", immigrantController.getDashboardData);

// ----------------------------------------------------
// Illegal (แอบเข้าเมือง)
// ----------------------------------------------------
router.get("/illegal/:id", illegalController.getIllegalById);
// 🟢 ใส่ protect เข้าไปก่อนหน้าฟังก์ชัน controller
router.post(
  "/illegal",
  protect,
  uploadMiddleware.fields([
    { name: "photo", maxCount: 1 },
    { name: "passport_photo", maxCount: 1 },
  ]),
  illegalController.createIllegal,
);
router.put(
  "/illegal/:id",
  protect,
  uploadMiddleware.fields([
    { name: "photo", maxCount: 1 },
    { name: "passport_photo", maxCount: 1 },
  ]),
  illegalController.updateIllegal,
);
router.delete("/illegal/:id", protect, illegalController.deleteIllegal);

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
router.get("/repatriated/:id", repatriated.getRepatriatedById);
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
