import type { RequestHandler } from "express";

import type { RequestHandlerWithUser } from "@/middleware/auth";
import type {
	GetMeResponse,
	LoginResponse,
	LogoutResponse,
	RegisterResponse,
	UpdatePasswordResponse,
	UpdateProfileResponse,
} from "@/schema/auth";

import {
	getMeController,
	loginController,
	logoutController,
	registerController,
	updatePasswordController,
	updateProfileController,
} from "@/controllers/auth";
import { handlerWrapper } from "@/utils/errors";

export const register: RequestHandler = async (req, res) => {
	const { status, response } = await handlerWrapper<RegisterResponse>(
		registerController.bind(undefined, req.body, res)
	);
	res.status(status).json(response);
};

export const login: RequestHandler = async (req, res) => {
	const { status, response } = await handlerWrapper<LoginResponse>(
		loginController.bind(undefined, req.body, res)
	);
	res.status(status).json(response);
};

export const logout: RequestHandler = async (req, res) => {
	const { status, response } = await handlerWrapper<LogoutResponse>(
		logoutController.bind(undefined, res)
	);
	res.status(status).json(response);
};

export const getMe: RequestHandlerWithUser = async (req, res) => {
	const { response, status } = await handlerWrapper<GetMeResponse>(
		getMeController.bind(undefined, res.locals.user)
	);
	res.status(status).json(response);
};

export const updateProfile: RequestHandlerWithUser = async (req, res) => {
	const { response, status } = await handlerWrapper<UpdateProfileResponse>(
		updateProfileController.bind(undefined, req.body, res.locals.user)
	);
	res.status(status).json(response);
};

export const updatePassword: RequestHandlerWithUser = async (req, res) => {
	const { response, status } = await handlerWrapper<UpdatePasswordResponse>(
		updatePasswordController.bind(undefined, req.body, res.locals.user)
	);
	res.status(status).json(response);
};
