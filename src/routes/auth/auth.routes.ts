import { Router } from "express";
import { Container } from "inversify";
import AuthController from "./auth.controller";
import {
  authMiddleware,
  refreshMiddleware,
} from "@app/lib/utils/middlewares/auth.middleware";

const createAuthRoutes = (ioc: Container): Router => {
  const router = Router();

  const ctrl = ioc.get(AuthController);

  router.get("/connection-link", ctrl.getAuthUrl);
  router.get("/callback", ctrl.exchangeAuthCode);
  router.post("/signup", ctrl.signUp);
  router.post("/login", ctrl.login);
  router.get("/refresh", refreshMiddleware, ctrl.refreshTokens);
  router.use(authMiddleware({ strict: true }));
  router.get("/refrest/external", ctrl.refreshExternalTokens);
  router.get("/logout", ctrl.logout);

  return router;
};

export { createAuthRoutes };
