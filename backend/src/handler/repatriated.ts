import type { RequestHandler } from "express";

import * as schema from "../schema/repatriated";

import * as controller from "../controllers/repatriated";

import { handlerWrapper } from "../utils/errors";
import { RequestHandlerWithUser } from "../middleware/auth";
import { ExpressFileFields } from "../utils/types";

type test = Parameters<typeof controller.getRepatriatedById>;
type testr = ReturnType<typeof controller.getRepatriatedById>;
type func = (...args: test) => testr;

export const getAllRepatriated: RequestHandler = async (req, res) => {
  const { status, response } = await handlerWrapper(
    controller.getAllRepatriated,
    undefined,
    req.query,
  );
  res.status(status).json(response);
};

export const getRepatriatedById: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const { status, response } = await handlerWrapper(
    controller.getRepatriatedById,
    undefined,
    req.params.id,
  );
  res.status(status).json(response);
};

export const createRepatriated: RequestHandlerWithUser = async (req, res) => {
  const { status, response } = await handlerWrapper(
    controller.createRepatriated,
    undefined,
    req.body,
    req.files as ExpressFileFields,
    res.locals.user,
  );
  res.status(status).json(response);
};

export const updateRepatriated: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const { status, response } = await handlerWrapper(
    controller.updateRepatriated,
    undefined,
    req.params.id,
    req.body,
    req.files as ExpressFileFields,
  );
  res.status(status).json(response);
};

export const deleteRepatriated: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const { status, response } = await handlerWrapper(
    controller.deleteRepatriated,
    undefined,
    req.params.id,
  );
  res.status(status).json(response);
};
