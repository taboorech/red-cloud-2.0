import { Router } from "express";
import { Container } from "inversify";
import GenreController from "./genre.controller";
import { requireRole } from "@app/lib/utils/middlewares/user.middleware";
import { UserRole } from "@app/lib/enum/user.enum";

const createPublicGenreRoutes = (ioc: Container): Router => {
  const router = Router();

  const ctrl = ioc.get(GenreController);

  router.get("/", ctrl.getGenres);

  return router;
};

const createProtectedGenreRoutes = (ioc: Container): Router => {
  const router = Router();

  const ctrl = ioc.get(GenreController);

  router.use(requireRole(UserRole.OPERATOR, UserRole.ADMIN));
  router.post("/", ctrl.createGenre);
  router.put("/:id", ctrl.updateGenre);
  router.delete("/:id", ctrl.deleteGenre);

  return router;
};

export { createPublicGenreRoutes, createProtectedGenreRoutes };
