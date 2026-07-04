import type { CookieOptions, Response } from "express";

import jwt from "jsonwebtoken";

export const getSignedJwtToken = (id: string) => {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("ระบบขาดการตั้งค่า JWT_SECRET ใน Environment Variables");
	}

	return jwt.sign({ id }, secret, {
		expiresIn:
			(process.env.JWT_EXPIRE as jwt.SignOptions["expiresIn"]) || "30d",
	});
};

export function setTokenCookie(user: User, res: Response): string {
	const token = getSignedJwtToken(user.id);

	const expire = process.env.JWT_COOKIE_EXPIRE;
	if (!expire)
		throw new Error(
			"ระบบขาดการตั้งค่า JWT_COOKIE_EXPIRE ใน Environment Variables"
		);

	const expireDays = parseInt(expire, 10) || 30;

	const options: CookieOptions = {
		path: "/",
		expires: new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000),
		httpOnly: true,
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		secure: process.env.NODE_ENV === "production",
	};

	res.cookie("token", token, options);

	return token;
}
