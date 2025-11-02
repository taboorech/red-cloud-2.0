import { UserBansModel } from "@app/lib/db/models/user-bans.model";
import { AppError } from "@app/lib/errors/app.error";
import { NextFunction, Request, Response } from "express";

const banMiddleware = async (req: Request, _: Response, next: NextFunction) => {
  const isBanned = await UserBansModel.query().findOne({
    user_id: req.user?.id,
    is_banned: true,
  });

  if (isBanned) {
    return next(new AppError(403, "Your account has been banned"));
  }

  next();
};

export { banMiddleware };
