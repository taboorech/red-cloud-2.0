import { Router } from "express";
import { Container } from "inversify";
import ProfleController from "./profile.controller";

const createProfileRoutes = (ioc: Container): Router => {
  const router = Router();

  const ctrl = ioc.get(ProfleController);

  router.get("/", ctrl.getProfile);
  router.put("/", ctrl.updateProfile);
  router.put("/password", ctrl.changeUserPassword);

  return router;
};

export { createProfileRoutes };
