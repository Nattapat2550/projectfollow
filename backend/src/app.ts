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

// Configure CORS first so options/error responses always include CORS headers
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

app.use(helmet());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
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
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `ไม่พบเส้นทาง API: ${req.method} ${req.originalUrl}`
  });
});

// Global Express Error Handler (Handles 413 Payload Too Large and runtime errors with CORS headers)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Error Handler:", err);
  const status = err.status || err.statusCode || 500;
  if (status === 413 || err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: "ขนาดของไฟล์หรือข้อมูลมีขนาดใหญ่เกินไป (Payload Too Large)",
    });
  }
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;