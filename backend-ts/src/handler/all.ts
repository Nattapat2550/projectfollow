import type { RequestHandler } from "express";

import type { GetAllDataResponse } from "@/schema/all";

import {
	getAllDataController,
	getDashboardDataController,
} from "@/controllers/all";
import { handlerWrapper } from "@/utils/errors";

export const getAllData: RequestHandler = async (req, res) => {
	const { response, status } = await handlerWrapper<GetAllDataResponse>(
		getAllDataController.bind(undefined, req.query)
	);
	res.status(status).json(response);
};

export const getDashboardData: RequestHandler = async (req, res) => {
	const { response, status } = await handlerWrapper<GetAllDataResponse>(
		getDashboardDataController.bind(undefined, req.query)
	);
	res.status(status).json(response);
};
