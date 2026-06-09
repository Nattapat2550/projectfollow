const express = require("express");
const cors = require("cors");
const path = require("path");

const immigrantRoutes = require("./routes/immigrants");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เสิร์ฟไฟล์รูปภาพ/ไฟล์แนบแบบ Public
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/immigrants", immigrantRoutes);
app.use("/api/dashboard", dashboardRoutes);

module.exports = app;