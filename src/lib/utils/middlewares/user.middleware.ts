import { Request, Response, NextFunction } from "express";
import { AppError } from "@app/lib/errors/app.error";
import { UserModel } from "@models/user.model";
import { UserRole } from "@app/lib/enum/user.enum";

const requireRole = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, "Unauthorized: missing user id");
      }

      const user = await UserModel.query().findOne({ id: userId });
      if (!user) {
        throw new AppError(404, "User not found");
      }

      if (user.role === UserRole.OWNER) {
        return next();
      }

      if (!allowedRoles.includes(user.role)) {
        throw new AppError(403, "Forbidden: insufficient permissions");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export { requireRole };
