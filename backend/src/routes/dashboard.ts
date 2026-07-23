import express from "express";
import { protect } from "../middleware/auth";
import {
  getIllegalDashboardStats,
  getRepatriatedDashboardStats,
} from "../handler/dashboard";

const router = express.Router();

router.get("/illegal", protect, getIllegalDashboardStats);
router.get("/repatriated", protect, getRepatriatedDashboardStats);

export default router;
