import { RequestHandler } from "express";
import { handlerWrapper } from "../utils/errors";

import * as controller from "../controllers/dashboard";

export const getIllegalDashboardStats: RequestHandler = async (req, res) => {
  const { status, response } = await handlerWrapper(
    controller.getIllegalDashboardStats,
    undefined,
    req.query,
  );
  res.status(status).json(response);
};

export const getRepatriatedDashboardStats: RequestHandler = async (
  req,
  res,
) => {
  const { status, response } = await handlerWrapper(
    controller.getRepatriatedDashboardStats,
    undefined,
    req.query,
  );
  res.status(status).json(response);
};
