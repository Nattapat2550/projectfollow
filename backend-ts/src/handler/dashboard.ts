import type { RequestHandler } from "express";

import { getIllegalDashboardController } from "@/controllers/illegalDashboard";
import { getRepatriatedDashboardController } from "@/controllers/repatriatedDashboard";
import { handlerWrapper } from "@/utils/api";

export const getIllegalDashboard: RequestHandler = async (req, res) => {
	const { response, status } = await handlerWrapper(
		getIllegalDashboardController.bind(undefined, req.query)
	);
	res.status(status).json(response);
};

export const getRepatriatedDashboard: RequestHandler = async (req, res) => {
	const { response, status } = await handlerWrapper(
		getRepatriatedDashboardController.bind(undefined, req.query)
	);
	res.status(status).json(response);
};
