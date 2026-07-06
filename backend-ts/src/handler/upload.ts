import type { RequestHandler } from "express";

import type { RequestHandlerWithUser } from "@/middleware/auth";
import type {
	GetUploadProgressResponse,
	UploadExcelResponse,
} from "@/schema/upload";

import {
	getUploadProgressController,
	uploadExcelController,
} from "@/controllers/upload";
import { handlerWrapper } from "@/utils/errors";

export const getUploadProgress: RequestHandler<{ jobId: string }> = async (
	req,
	res
) => {
	const { status, response } = await handlerWrapper<GetUploadProgressResponse>(
		getUploadProgressController.bind(undefined, req.params.jobId)
	);
	res.status(status).json(response);
};

export const uploadExcel: RequestHandlerWithUser = async (req, res) => {
	const { status, response } = await handlerWrapper<UploadExcelResponse>(
		uploadExcelController.bind(undefined, req.query, req.file, res.locals.user)
	);
	res.status(status).json(response);
};
