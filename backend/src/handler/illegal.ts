import type { RequestHandler } from "express";

import type { RequestHandlerWithUser } from "../middleware/auth";
import type * as schema from "../schema/illegal";

import * as controller from "../controllers/illegal";
import { handlerWrapper } from "../utils/errors";
import { ExpressFileFields } from "../utils/types";

export const getIllegalById: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const { status, response } = await handlerWrapper(
    controller.getIllegalById.bind(undefined, req.params.id),
  );
  res.status(status).json(response);
};

export const createIllegal: RequestHandlerWithUser = async (req, res) => {
  const { status, response } = await handlerWrapper(
    controller.createIllegal.bind(
      undefined,
      req.body,
      req.files as ExpressFileFields,
      res.locals.user,
    ),
  );
  res.status(status).json(response);
};

export const updateIllegal: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const { status, response } = await handlerWrapper(
    controller.updateIllegal,
    undefined,
    req.params.id,
    req.body,
    req.files as ExpressFileFields,
  );
  res.status(status).json(response);
};

export const deleteIllegal: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const { status, response } = await handlerWrapper(
    controller.deleteIllegal.bind(undefined, req.params.id),
  );
  res.status(status).json(response);
};
