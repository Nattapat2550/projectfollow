import type { RequestHandler } from "express";

import * as schema from "../schema/auth";

import * as controller from "../controllers/auth";

import { handlerWrapper } from "../utils/errors";
import { RequestHandlerWithUser } from "../middleware/auth";

export const register: RequestHandler = async (req, res) => {
  const { status, response } = await handlerWrapper(
    controller.register,
    undefined,
    req.body,
    res,
  );
  res.status(status).json(response);
};

export const login: RequestHandler = async (req, res) => {
  const { status, response } = await handlerWrapper(
    controller.login,
    undefined,
    req.body,
    res,
  );
  res.status(status).json(response);
};

export const logout: RequestHandler = async (req, res) => {
  const { status, response } = await handlerWrapper(
    controller.logout,
    undefined,
    res,
  );
  res.status(status).json(response);
};

export const getMe: RequestHandlerWithUser = async (req, res) => {
  const { response, status } = await handlerWrapper(
    controller.getMe,
    undefined,
    res.locals.user,
  );
  res.status(status).json(response);
};

export const updateProfile: RequestHandlerWithUser = async (req, res) => {
  const { response, status } = await handlerWrapper(
    controller.updateProfile,
    undefined,
    req.body,
    res.locals.user,
  );
  res.status(status).json(response);
};

export const updatePassword: RequestHandlerWithUser = async (req, res) => {
  const { response, status } = await handlerWrapper(
    controller.updatePassword,
    undefined,
    req.body,
    res.locals.user,
  );
  res.status(status).json(response);
};
