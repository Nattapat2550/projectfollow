import type { Response } from "express";

import bcrypt from "bcryptjs";

import type {
	GetMeResponse,
	LogoutResponse,
	UpdatePassswordRequest,
	UpdatePasswordResponse,
	UpdateProfileRequest,
	UpdateProfileResponse,
} from "@/schema/auth";
import type { LoginResponse } from "@/schema/auth";
import type { LoginRequest } from "@/schema/auth";
import type { RegisterResponse } from "@/schema/auth";
import type { RegisterRequest } from "@/schema/auth";

import { error } from "@/utils/errors";
import { setTokenCookie } from "@/utils/jwt";

import pool from "../db";

export async function registerController(
	req: Partial<RegisterRequest>,
	res: Response
): Promise<RegisterResponse> {
	const { name, password, role = "user", color = "#3B82F6" } = req;
	if (!name || !password) error(400, "Please provide a name and password");

	const existingUserResult = await pool.query(
		"SELECT id FROM users WHERE name = $1",
		[name]
	);
	if (existingUserResult.rows.length > 0) error(400, "Name already in use");

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	const insertQuery = `
      INSERT INTO users (name, password, role, color) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *;
    `;
	const newUserResult = await pool.query(insertQuery, [
		name,
		hashedPassword,
		role,
		color,
	]);
	const user = newUserResult.rows[0];

	const token = setTokenCookie(user, res);

	return {
		success: true,
		token,
		user: { id: user.id, name: user.name, role: user.role, color: user.color },
	};
}

export async function loginController(
	req: Partial<LoginRequest>,
	res: Response
): Promise<LoginResponse> {
	const { name, password } = req;
	if (!name || !password)
		return error(400, "Please provide a name and password");

	const userResult = await pool.query("SELECT * FROM users WHERE name = $1", [
		name,
	]);
	const user = userResult.rows[0];
	if (!user) error(401, "Invalid credentials");

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) error(401, "Invalid credentials");

	const token = setTokenCookie(user, res);

	return {
		success: true,
		token,
		user: { id: user.id, name: user.name, role: user.role, color: user.color },
	};
}

export async function logoutController(res: Response): Promise<LogoutResponse> {
	res.cookie("token", "none", {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
		path: "/",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		secure: process.env.NODE_ENV === "production",
	});

	res.setHeader("Clear-Site-Data", '"cookies", "storage"');
	return { success: true };
}

export async function getMeController(user?: User): Promise<GetMeResponse> {
	if (!user) error(401, "unauthorized");
	return { success: true, data: user };
}

export async function updateProfileController(
	req: Partial<UpdateProfileRequest>,
	user?: User
): Promise<UpdateProfileResponse> {
	if (!user) error(401, "unauthorized");

	const { name, color } = req;
	if (!name || !color) error(400, "name and color is required");

	const userResult = await pool.query(
		"UPDATE users SET name = $1, color = $2 WHERE id = $3 RETURNING id, name, role, color",
		[name, color, user.id]
	);

	return { success: true, data: userResult.rows[0] };
}

export async function updatePasswordController(
	req: Partial<UpdatePassswordRequest>,
	user?: User
): Promise<UpdatePasswordResponse> {
	if (!user) error(401, "unauthorized");

	const { password } = req;
	if (!password) error(400, "password is required");

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);
	await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
		hashedPassword,
		user.id,
	]);
	return { success: true, msg: "อัปเดตรหัสผ่านสำเร็จ" };
}
