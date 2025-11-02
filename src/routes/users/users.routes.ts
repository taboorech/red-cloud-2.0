import { UserRole } from "@app/lib/enum/user.enum";
import { requireRole } from "@app/lib/utils/middlewares/user.middleware";
import { Router } from "express";
import { Container } from "inversify";
import UsersController from "./users.controller";

const createUsersRoutes = (ioc: Container): Router => {
  const router = Router();

  const ctrl = ioc.get(UsersController);

  router.get("/all", requireRole(UserRole.ADMIN), ctrl.getAllUsers);
  router.put("/role", requireRole(UserRole.ADMIN), ctrl.updateUserRole);
  router.put(
    "/change-access",
    requireRole(UserRole.ADMIN),
    ctrl.changeUserAccess,
  );

  return router;
};

export { createUsersRoutes };
