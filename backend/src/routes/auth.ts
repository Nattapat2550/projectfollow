import express from "express";
import * as auth from "../handler/auth";
import { protect } from "../middleware/auth";

const router = express.Router();

// router.post("/register", auth.register);
router.post("/login", auth.login);
router.get("/logout", protect, auth.logout);
router.get("/me", protect, auth.getMe);

// เพิ่มเส้นทางสำหรับอัปเดตข้อมูลผู้ใช้งาน
router.put("/profile", protect, auth.updateProfile);
router.put("/password", protect, auth.updatePassword);

export default router;
