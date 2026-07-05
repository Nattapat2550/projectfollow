import bcrypt from "bcryptjs";

import type { UpdatePasswordResponse } from "@/schema/auth";
import type { UpdatePassswordRequest } from "@/schema/auth";
import type { UpdateProfileResponse } from "@/schema/auth";
import type { UpdateProfileRequest } from "@/schema/auth";
import type { GetMeResponse } from "@/schema/auth";

import pool from "@/db";
import { error } from "@/errors";

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

	try {
		const userResult = await pool.query(
			"UPDATE users SET name = $1, color = $2 WHERE id = $3 RETURNING id, name, role, color",
			[name, color, user.id]
		);

		return { success: true, data: userResult.rows[0] };
	} catch {
		error(500, "Database Error");
	}
}

export async function updatePasswordController(
	req: Partial<UpdatePassswordRequest>,
	user?: User
): Promise<UpdatePasswordResponse> {
	if (!user) error(401, "unauthorized");

	try {
		const { password } = req;
		if (!password) error(400, "password is required");

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
			hashedPassword,
			user.id,
		]);
		return { success: true, msg: "อัปเดตรหัสผ่านสำเร็จ" };
	} catch {
		error(500, "Database Error");
	}
}
