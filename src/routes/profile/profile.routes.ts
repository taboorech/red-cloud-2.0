import { Router } from "express";
import { Container } from "inversify";
import { ProfileController } from "./profile.controller";
import { PrivacyController } from "./privacy.controller";
import multer from "multer";
import { multerStorage } from "@app/lib/utils/multer";

const createProfileRoutes = (ioc: Container): Router => {
  const router = Router();

  const ctrl = ioc.get(ProfileController);
  const privacy = ioc.get(PrivacyController);

  const upload = multer({ storage: multerStorage });

  router.get("/", ctrl.getProfile);
  router.get("/stats", ctrl.getStats);
  router.put("/", upload.single("avatar"), ctrl.updateProfile);
  router.put("/password", ctrl.changeUserPassword);

  router.get("/privacy", privacy.getPrivacy);
  router.patch("/privacy", privacy.updatePrivacy);
  router.post("/privacy/hide-from/:scope/:friendId", privacy.hideFrom);
  router.delete("/privacy/hide-from/:scope/:friendId", privacy.unhideFrom);

  return router;
};

export { createProfileRoutes };
