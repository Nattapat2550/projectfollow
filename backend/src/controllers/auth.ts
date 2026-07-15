import pool from "../config/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import * as schema from "../schema/auth";
import { error } from "../utils/errors";
import { Response } from "express";

const getSignedJwtToken = (id: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("ระบบขาดการตั้งค่า JWT_SECRET ใน Environment Variables");
  }

  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

const setResponseTokenCookie = (user, res): string => {
  const token = getSignedJwtToken(user.id);

  const expireDays = parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 30;

  const options = {
    expires: new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    path: "/",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  };

  res.cookie("token", token, options);
  return token;
};

export async function register(
  body: schema.RegisterRequest,
  res: Response,
): Promise<schema.RegisterResponse> {
  const { name, password, role, color } = body;

  if (!name || !password) error(400, "Please provide a name and password");

  const existingUserResult = await pool.query(
    "SELECT id FROM users WHERE name = $1",
    [name],
  );
  if (existingUserResult.rows.length > 0) error(400, "Name already in use");

  const userRole = role || "user";
  const userColor = color || "#3B82F6";

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
    userRole,
    userColor,
  ]);
  const user = newUserResult.rows[0];
  const token = setResponseTokenCookie(user, res);

  return {
    success: true,
    token,
    user: { id: user.id, name: user.name, role: user.role, color: user.color },
  };
}

export async function login(
  body: schema.LoginRequest,
  res: Response,
): Promise<schema.LoginResponse> {
  const { name, password } = body;

  if (!name || !password)
    return error(400, "Please provide a name and password");

  const userResult = await pool.query("SELECT * FROM users WHERE name = $1", [
    name,
  ]);
  const user = userResult.rows[0];
  if (!user) error(401, "Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) error(401, "Invalid credentials");

  const token = setResponseTokenCookie(user, res);

  return {
    success: true,
    token,
    user: { id: user.id, name: user.name, role: user.role, color: user.color },
  };
}

export async function logout(res: Response): Promise<schema.LogoutResponse> {
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

export async function getMe(user?: User): Promise<schema.GetMeResponse> {
  if (!user) error(401, "unauthorized");
  return { success: true, data: user };
}

export async function updateProfile(
  body: Partial<schema.UpdateProfileRequest>,
  user?: User,
): Promise<schema.UpdateProfileResponse> {
  if (!user) error(401, "unauthorized");

  const { name, color } = body;
  if (!name || !color) error(400, "name and color is required");

  const userResult = await pool.query(
    "UPDATE users SET name = $1, color = $2 WHERE id = $3 RETURNING id, name, role, color",
    [name, color, user.id],
  );
  return { success: true, data: userResult.rows[0] };
}

export async function updatePassword(
  body: Partial<schema.UpdatePassswordRequest>,
  user?: User,
): Promise<schema.UpdatePasswordResponse> {
  if (!user) error(401, "unauthorized");

  const { password } = body;
  if (!password) error(400, "password is required");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
    hashedPassword,
    user.id,
  ]);
  return { success: true, msg: "อัปเดตรหัสผ่านสำเร็จ" };
}
