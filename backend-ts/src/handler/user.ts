import type { ErrorResponse } from "@/errors";
import type { RequestHandlerWithUser } from "@/middleware/auth";
import type {
	GetMeResponse,
	UpdatePasswordResponse,
	UpdateProfileResponse,
} from "@/schema/auth";

import {
	getMeController,
	updatePasswordController,
	updateProfileController,
} from "@/controllers/user";
import { handlerWrapper } from "@/utils/api";

export const getMe: RequestHandlerWithUser<
	GetMeResponse | ErrorResponse
> = async (req, res) => {
	const { response, status } = await handlerWrapper<GetMeResponse>(
		getMeController.bind(undefined, res.locals.user)
	);
	res.status(status).json(response);
};

export const updateProfile: RequestHandlerWithUser<
	UpdateProfileResponse | ErrorResponse
> = async (req, res) => {
	const { response, status } = await handlerWrapper(
		updateProfileController.bind(undefined, req.body, res.locals.user)
	);
	res.status(status).json(response);
};

export const updatePassword: RequestHandlerWithUser<
	UpdatePasswordResponse | ErrorResponse
> = async (req, res) => {
	const { response, status } = await handlerWrapper(
		updatePasswordController.bind(undefined, req.body, res.locals.user)
	);
	res.status(status).json(response);
};
