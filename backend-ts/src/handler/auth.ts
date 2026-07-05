import type { RequestHandler } from "express";

import type {
	LoginResponse,
	LogoutResponse,
	RegisterResponse,
} from "@/schema/auth";

import {
	loginController,
	logoutController,
	registerController,
} from "@/controllers/auth";
import { handlerWrapper } from "@/utils/api";

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
