import type { RequestHandler } from "express";

import {
	loginController,
	logoutController,
	registerController,
} from "@/controllers/auth";
import { handlerWrapper } from "@/utils/api";

export type RegisterRequest = {
	name: string;
	password: string;
	role: string;
	color: string;
};

export type RegisterResponse = {
	success: true;
	token: string;
	user: User;
};

export const register: RequestHandler = async (req, res) => {
	const { status, response } = await handlerWrapper<RegisterResponse>(
		registerController.bind(undefined, req.body, res)
	);
	res.status(status).json(response);
};

export type LoginRequest = {
	name: string;
	password: string;
};

export type LoginResponse = {
	success: true;
	token: string;
	user: User;
};

export const login: RequestHandler = async (req, res) => {
	const { status, response } = await handlerWrapper<LoginResponse>(
		loginController.bind(undefined, req.body, res)
	);
	res.status(status).json(response);
};

export type LogoutResponse = { success: true };

export const logout: RequestHandler = async (req, res) => {
	const { status, response } = await handlerWrapper<LogoutResponse>(
		logoutController.bind(undefined, res)
	);
	res.status(status).json(response);
};
