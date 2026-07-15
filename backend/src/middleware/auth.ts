import jwt from "jsonwebtoken";
import pool from "../config/db";
import { RequestHandler } from "express";
import { error } from "../utils/errors";

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
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token || token === "null") {
    return res.status(401).json({
      success: false,
      message: "Not authorize to access this route",
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) error(500, "Server misconfiguration: Missing JWT_SECRET");

    const decoded = jwt.verify(token, secret);

    const result = await pool.query(
      "SELECT id, name, role, color FROM users WHERE id = $1",
      [decoded.id],
    );
    res.locals.user = result.rows[0];
    // TODO
    req.user = result.rows[0];

    if (!req.user) error(401, "User not found, authorization denied");

    next();
  } catch (err) {
    console.error(err);
    error(401, "Not authorize to access this route");
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
