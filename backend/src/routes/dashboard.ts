import express from "express";
import { getDashboardStats } from "../controllers/dashboardController";
import { protect } from "../middleware/auth";
import {
  getIllegalDashboardStats,
  getRepatriatedDashboardStats,
} from "../handler/dashboard";

const router = express.Router();

router.get("/", protect, getDashboardStats);

router.get("/illegal", protect, getIllegalDashboardStats);
router.get("/repatriated", protect, getRepatriatedDashboardStats);

export default router;
