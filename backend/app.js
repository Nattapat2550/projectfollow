const express = require("express");
const cors = require("cors");
const path = require("path");

const immigrantRoutes = require("./routes/immigrants");
const dashboardRoutes = require("./routes/dashboard");
const testUpload2Routes = require("./routes/testUpload2");

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เสิร์ฟไฟล์รูปภาพ/ไฟล์แนบแบบ Public
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/immigrants", immigrantRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/test-upload2", testUpload2Routes);

module.exports = app;