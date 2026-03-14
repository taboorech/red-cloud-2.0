import { Router } from "express";
import { Container } from "inversify";
import { AIController } from "./ai.controller";
import multer from "multer";
import { multerStorage } from "@app/lib/utils/multer";

const createAIRoutes = (ioc: Container): Router => {
  const router = Router();

  const upload = multer({ storage: multerStorage });
  const ctrl = ioc.get(AIController);

  router.post("/generate-image", ctrl.generateImage);
  router.post(
    "/generate-lyrics",
    upload.single("audioFile"),
    ctrl.generateLyrics,
  );

  return router;
};

export { createAIRoutes };
