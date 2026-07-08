import type { RequestHandler } from "express";

import type { GetDashboardStatsResponse } from "@/schema/dashboard";

import { getDashboardStatsController } from "@/controllers/dashboard";
import { handlerWrapper } from "@/utils/errors";

export const getDashboardStats: RequestHandler = async (req, res) => {
	const { response, status } = await handlerWrapper<GetDashboardStatsResponse>(
		getDashboardStatsController.bind(undefined, req.query)
	);
	res.status(status).json(response);
};
