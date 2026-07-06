import type { RequestHandler } from "express";

import type { RequestHandlerWithUser } from "@/middleware/auth";

import {
	createIllegalController,
	deleteIllegalController,
	getIllegalByIdController,
	getUploadProgressController,
	updateIllegalController,
	uploadExcelIllegalController,
} from "@/controllers/illegal";
import { handlerWrapper } from "@/utils/api";

export type GetIllegalByIdResponse = {
	success: boolean;
	data?: IllegalData;
	message?: string;
};

export const getIllegalById: RequestHandler<{ id: string }> = async (
	req,
	res
) => {
	const { status, response } = await handlerWrapper<GetIllegalByIdResponse>(
		getIllegalByIdController.bind(undefined, req.params.id)
	);
	res.status(status).json(response);
};

export type CreateIllegalRequest = {
	first_name_th: string;
	middle_name_th: string | undefined | null;
	last_name_th: string;
	first_name_en: string | undefined | null;
	middle_name_en: string | undefined | null;
	last_name_en: string | undefined | null;
	gender: string;
	date_of_birth: string | undefined | null;
	passport_id: string | undefined | null;
	age: string | undefined | null;
	nationality: string;
	detected_location_details: string;
	detected_location_sub_district: string;
	detected_location_district: string;
	detected_location_province: string;
	workplace: string;
	screening_details: string;
	is_victim: string;
	detected_date: string;
	note: string;
};

export type CreateIllegalResponse = {
	success: boolean;
	data?: IllegalData;
	message?: string;
};

export type CreateIllegalFileRequest = {
	[fieldname: string]: Express.Multer.File[];
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

export type UpdateIllegalRequest = {
	first_name_th: string;
	middle_name_th: string | undefined | null;
	last_name_th: string;
	first_name_en: string | undefined | null;
	middle_name_en: string | undefined | null;
	last_name_en: string | undefined | null;
	gender: string;
	date_of_birth: string | undefined | null;
	passport_id: string | undefined | null;
	age: string | undefined | null;
	nationality: string;
	detected_location_details: string;
	detected_location_sub_district: string;
	detected_location_district: string;
	detected_location_province: string;
	workplace: string;
	screening_details: string;
	is_victim: string;
	detected_date: string;
	note: string;
};

export type UpdateIllegalResponse = {
	success: boolean;
	data?: IllegalData;
	message?: string;
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

export type DeleteIllegalResponse = {
	success: true;
	message: string;
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

export type GetUploadProgressResponse = {
	current: number;
	total: number;
	successCount: number;
	failedCount: number;
	status: string;
};
export const getUploadProgress: RequestHandler<{ jobId: string }> = async (
	req,
	res
) => {
	const { status, response } = await handlerWrapper<GetUploadProgressResponse>(
		getUploadProgressController.bind(undefined, req.params.jobId)
	);
	res.status(status).json(response);
};

export type UploadExcelIllegalRequestQuery = {
	action: string;
	jobId: string;
};

export type UploadExcellIllegalResponse = {
	success: true;
	message: string;
	errors?: string[];
	total_rows?: number;
	preview_data?: {
		ลำดับที่อ่านได้: number;
		first_name_th: string;
		middle_name_th: string | null;
		last_name_th: string;
		first_name_en: string | null;
		middle_name_en: string | null;
		last_name_en: string | null;
		nationality: any;
		passport_id: string | null;
		date_of_birth: string | null | undefined;
		detected_location_details: string;
		detected_location_sub_district: string | null | undefined;
		detected_location_district: string | null | undefined;
		detected_location_province: string | null | undefined;
		workplace: string | null;
		gender: any;
		detected_date: string | null | undefined;
		is_victim: string;
		screening_details: string;
		raw_data_from_excel: any;
	}[];
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
