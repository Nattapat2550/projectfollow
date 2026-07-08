import express from "express";

import { login, logout } from "@/handler/auth";
import { updatePassword } from "@/handler/auth";
import { updateProfile } from "@/handler/auth";
import { getMe } from "@/handler/auth";
import { protect } from "@/middleware/auth";

const router = express.Router();

// router.post("/register", register);
router.post("/login", login);
router.get("/logout", protect, logout);
router.get("/me", protect, getMe);

router.put("/profile", protect, updateProfile);
router.put("/password", protect, updatePassword);

export default router;
