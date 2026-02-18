import { Router } from "express";
import { Container } from "inversify";
import ProfleController from "./profile.controller";
import multer from "multer";
import { multerStorage } from "@app/lib/utils/multer";

const createProfileRoutes = (ioc: Container): Router => {
  const router = Router();

  const ctrl = ioc.get(ProfleController);

  const upload = multer({ storage: multerStorage });

  router.get("/", ctrl.getProfile);
  router.get("/stats", ctrl.getStats);
  router.put("/", upload.single("avatar"), ctrl.updateProfile);
  router.put("/password", ctrl.changeUserPassword);

  return router;
};

export { createProfileRoutes };
