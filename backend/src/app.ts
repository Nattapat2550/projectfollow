import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import fs from "fs";

import immigrantRoutes from "./routes/immigrants";
import dashboardRoutes from "./routes/dashboard";
import testUpload2Routes from "./routes/testUpload2";
import authRoutes from "./routes/auth"; // นำเข้า Auth Route

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

let uploadsPath = "./uploads";
if (!fs.existsSync(uploadsPath) && fs.existsSync("./backend/uploads")) {
  uploadsPath = "./backend/uploads";
}
app.use("/uploads", express.static(uploadsPath));

// 🟢 เพิ่ม Route หน้าแรก (Root) เอาไว้ตอบกลับ ServerAwaker โดยเฉพาะ
app.get("/", (req, res) => {
  res.status(200).send("Backend is awake!");
});

// 📌 Routes: ปรับปรุงให้มี /api/v1/ นำหน้าทุกจุดให้ตรงกับหน้าบ้าน
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/immigrants", immigrantRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/test-upload2", testUpload2Routes);

// ⚠️ ดักจับกรณีเรียก Route ที่ไม่มีอยู่จริง (404 handler)
// เปลี่ยนจากการส่งหน้า HTML เป็นการส่ง JSON เพื่อไม่ให้ Frontend แครช
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `ไม่พบเส้นทาง API: ${req.method} ${req.originalUrl}`
  });
});

export default app;