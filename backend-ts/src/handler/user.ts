import type { ErrorResponse } from "@/errors";
import type { RequestHandlerWithUser } from "@/middleware/auth";

import {
	updatePasswordController,
	updateProfileController,
} from "@/controllers/user";
import { handlerWrapper } from "@/utils/api";

export type GetMeResponse = { success: true; data: User };

export const getMe: RequestHandlerWithUser = async (req, res) => {
	const response: GetMeResponse = {
		success: true,
		data: res.locals.user!,
	};
	res.status(200).json(response);
};

export type UpdateProfileRequest = { name: string; color: string };

export type UpdateProfileResponse = { success: true; data: User };

export const updateProfile: RequestHandlerWithUser<
	UpdateProfileResponse | ErrorResponse
> = async (req, res) => {
	const { response, status } = await handlerWrapper(
		updateProfileController.bind(undefined, req.body, res.locals.user)
	);
	res.status(status).json(response);
};

export type UpdatePassswordRequest = { password: string };

export type UpdatePasswordResponse = { success: true; msg: string };

export const updatePassword: RequestHandlerWithUser<
	UpdatePasswordResponse | ErrorResponse
> = async (req, res) => {
	const { response, status } = await handlerWrapper(
		updatePasswordController.bind(undefined, req.body, res.locals.user)
	);
	res.status(status).json(response);
};
