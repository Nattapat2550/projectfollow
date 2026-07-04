import express from "express";

import { login, logout } from "@/handler/auth";
import { getMe, updatePassword, updateProfile } from "@/handler/user";
import { protect } from "@/middleware/auth";

const router = express.Router();

// router.post("/register", register);
router.post("/login", login);
router.get("/logout", protect, logout);
router.get("/me", protect, getMe);

router.put("/profile", protect, updateProfile);
router.put("/password", protect, updatePassword);

export default router;
