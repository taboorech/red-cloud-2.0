import { Router } from "express";
import { Container } from "inversify";
import { SearchController } from "./search.controller";

const createSearchRoutes = (ioc: Container) => {
  const router = Router();

  const ctrl = ioc.get(SearchController);

  router.get("/", ctrl.search);

  return router;
};

export { createSearchRoutes };
