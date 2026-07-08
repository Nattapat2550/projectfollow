import express from "express";

import { getDashboardStats } from "@/handler/dashboard";

const router = express.Router();

router.get("/", getDashboardStats);

export default router;
