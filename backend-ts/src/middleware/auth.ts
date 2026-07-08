import type { RequestHandler } from "express";

import jwt from "jsonwebtoken";

import { error, getErrorResponse } from "@/utils/errors";

import pool from "../db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequestHandlerWithUser<T = any> = RequestHandler<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any,
	T,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any,
	{ user?: User }
>;

// Protect routes
export const protect: RequestHandlerWithUser = async (req, res, next) => {
	try {
		let token;

		if (
			req.headers.authorization
			&& req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];
		} else if (req.cookies && req.cookies.token) {
			token = req.cookies.token;
		}

		if (!token || token === "null")
			error(400, "Not authorize to access this route");

		try {
			const secret = process.env.JWT_SECRET;
			if (!secret) error(500, "Server misconfiguration: Missing JWT_SECRET");

			const decoded = jwt.verify(token, secret);

			const result = await pool.query(
				"SELECT id, name, role, color FROM users WHERE id = $1",
				[typeof decoded === "string" ? decoded : decoded.id]
			);
			res.locals.user = result.rows[0];
			if (!res.locals.user) error(401, "User not found, authorization denied");

			next();
		} catch (err) {
			console.error(err);
			error(401, "Not authorize to access this route");
		}
	} catch (error) {
		const { status, response } = getErrorResponse(error);
		return res.status(status).json(response);
	}
};

// Grant access to specific roles
export const authorize = (...roles: string[]): RequestHandlerWithUser => {
	return (req, res, next) => {
		try {
			if (!res.locals.user) error(401, "Not authorize to access this route");

			if (!roles.includes(res.locals.user.role)) {
				error(
					403,
					`User role ${res.locals.user.role} is not authorized to access this route`
				);
			}

			next();
		} catch (error) {
			const { status, response } = getErrorResponse(error);
			return res.status(status).json(response);
		}
	};
};
