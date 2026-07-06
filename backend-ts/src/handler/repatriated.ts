import type { RequestHandler } from "express";

import type { RequestHandlerWithUser } from "@/middleware/auth";
import type {
	CreateRepatriatedResponse,
	DeleteRepatriatedResponse,
	GetRepatriatedByIdResponse,
	UpdateRepatriatedResponse,
} from "@/schema/repatriated";

import {
	createRepatriatedController,
	deleteRepatriatedController,
	getRepatriatedByIdController,
	updateRepatriatedController,
} from "@/controllers/repatriated";
import { handlerWrapper } from "@/utils/errors";

export const getRepatriatedById: RequestHandler<{ id: string }> = async (
	req,
	res
) => {
	const { status, response } = await handlerWrapper<GetRepatriatedByIdResponse>(
		getRepatriatedByIdController.bind(undefined, req.params.id)
	);
	res.status(status).json(response);
};

export const createRepatriated: RequestHandlerWithUser = async (req, res) => {
	const { status, response } = await handlerWrapper<CreateRepatriatedResponse>(
		createRepatriatedController.bind(
			undefined,
			req.body,
			req.files,
			res.locals.user
		)
	);
	res.status(status).json(response);
};

export const updateRepatriated: RequestHandler<{ id: string }> = async (
	req,
	res
) => {
	const { status, response } = await handlerWrapper<UpdateRepatriatedResponse>(
		updateRepatriatedController.bind(
			undefined,
			req.params.id,
			req.body,
			req.files
		)
	);
	res.status(status).json(response);
};

export const deleteRepatriated: RequestHandler<{ id: string }> = async (
	req,
	res
) => {
	const { status, response } = await handlerWrapper<DeleteRepatriatedResponse>(
		deleteRepatriatedController.bind(undefined, req.params.id)
	);
	res.status(status).json(response);
};
