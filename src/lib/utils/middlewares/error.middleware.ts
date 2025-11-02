import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError } from "@app/lib/errors/app.error";
import { logger } from "@app/lib/logger";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger().error(err);

  if (err instanceof ZodError) {
    res.status(400).send({ errors: err.issues });
    return next(err);
  } else if (err instanceof AppError) {
    res
      .status(err.statusNumber || 500)
      .send({ errors: [{ message: err.message || "Something went wrong" }] });
    return next(err);
  }

  res.status(500).send(err as string);

  return next(err);
};
