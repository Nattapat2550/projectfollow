import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import fs from "fs";

import immigrantRoutes from "./routes/immigrants";
import dashboardRoutes from "./routes/dashboard";
import uploadExcelRepatriatedRoutes from "./routes/uploadExcelRepatriated";
import authRoutes from "./routes/auth"; // นำเข้า Auth Route

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
// Configure CORS with trailing slash normalization and support for Vercel origins
const rawFrontendUrls = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = rawFrontendUrls
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.includes('localhost') ||
        cleanOrigin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      callback(new Error(`CORS policy: ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
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
app.use("/api/v1/upload-excel-repatriated", uploadExcelRepatriatedRoutes);

// ⚠️ ดักจับกรณีเรียก Route ที่ไม่มีอยู่จริง (404 handler)
// เปลี่ยนจากการส่งหน้า HTML เป็นการส่ง JSON เพื่อไม่ให้ Frontend แครช
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `ไม่พบเส้นทาง API: ${req.method} ${req.originalUrl}`
  });
});

export default app;