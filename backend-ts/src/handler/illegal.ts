import type { RequestHandler } from "express";

import type { RequestHandlerWithUser } from "@/middleware/auth";
import type {
	CreateIllegalResponse,
	GetIllegalByIdResponse,
	GetIllegalUploadProgressResponse,
	UpdateIllegalResponse,
	UploadExcellIllegalResponse,
} from "@/schema/illegal";

import {
	createIllegalController,
	deleteIllegalController,
	getIllegalByIdController,
	getIllegalUploadProgressController,
	updateIllegalController,
	uploadExcelIllegalController,
} from "@/controllers/illegal";
import { handlerWrapper } from "@/utils/errors";

export const getIllegalById: RequestHandler<{ id: string }> = async (
	req,
	res
) => {
	const { status, response } = await handlerWrapper<GetIllegalByIdResponse>(
		getIllegalByIdController.bind(undefined, req.params.id)
	);
	res.status(status).json(response);
};

export const createIllegal: RequestHandlerWithUser = async (req, res) => {
	const { status, response } = await handlerWrapper<CreateIllegalResponse>(
		createIllegalController.bind(
			undefined,
			req.body,
			req.files,
			res.locals.user
		)
	);
	res.status(status).json(response);
};

export const updateIllegal: RequestHandler<{ id: string }> = async (
	req,
	res
) => {
	const { status, response } = await handlerWrapper<UpdateIllegalResponse>(
		updateIllegalController.bind(undefined, req.params.id, req.body, req.files)
	);
	res.status(status).json(response);
};

export const deleteIllegal: RequestHandler<{ id: string }> = async (
	req,
	res
) => {
	const { status, response } = await handlerWrapper<CreateIllegalResponse>(
		deleteIllegalController.bind(undefined, req.params.id)
	);
	res.status(status).json(response);
};

export const getUploadProgressIllegal: RequestHandler<{
	jobId: string;
}> = async (req, res) => {
	const { status, response } =
		await handlerWrapper<GetIllegalUploadProgressResponse>(
			getIllegalUploadProgressController.bind(undefined, req.params.jobId)
		);
	res.status(status).json(response);
};

export const uploadExcelIllegal: RequestHandlerWithUser = async (req, res) => {
	const { status, response } =
		await handlerWrapper<UploadExcellIllegalResponse>(
			uploadExcelIllegalController.bind(
				undefined,
				req.query,
				req.file,
				res.locals.user
			)
		);
	res.status(status).json(response);
};
