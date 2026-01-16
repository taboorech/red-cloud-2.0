import { Router } from "express";
import { Container } from "inversify";
import { AIController } from "./ai.controller";

const createAIRoutes = (ioc: Container): Router => {
  const router = Router();

  const ctrl = ioc.get(AIController);

  router.post("/generate-image", ctrl.generateImage);

  return router;
};

export { createAIRoutes };
