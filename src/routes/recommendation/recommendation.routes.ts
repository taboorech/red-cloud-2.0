import { Router } from "express";
import { Container } from "inversify";
import { RecommendationController } from "./recommendation.controller";

const createRecommendationRoutes = (ioc: Container): Router => {
  const router = Router();
  const ctrl = ioc.get(RecommendationController);

  router.get("/", ctrl.getRecommendations);

  return router;
};

export { createRecommendationRoutes };
