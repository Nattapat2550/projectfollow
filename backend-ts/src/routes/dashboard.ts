import express from "express";

import { getDashboardStats } from "../controllers/dashboard";

const router = express.Router();

router.get("/", getDashboardStats);

export default router;
