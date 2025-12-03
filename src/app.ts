import express, { Router } from "express";
import cors from "cors";
import { createAuthRoutes } from "./routes/auth/auth.routes";
import { Container } from "inversify";
import { errorMiddleware } from "./lib/utils/middlewares/error.middleware";
import { createUsersRoutes } from "./routes/users/users.routes";
import { createProfileRoutes } from "./routes/profile/profile.routes";
import { authMiddleware } from "./lib/utils/middlewares/auth.middleware";
import { banMiddleware } from "./lib/utils/middlewares/ban.middleware";
import {
  createPublicGenreRoutes,
  createProtectedGenreRoutes,
} from "./routes/genre/genre.routes";
import {
  createProtectedPaymentRoutes,
  createPublicPaymentRoutes,
} from "./routes/payment/payment.routes";
import PaymentController from "./routes/payment/payment.controller";
import { createSongRoutes } from "./routes/song/song.routes";
import { createPlaylistRoutes } from "./routes/playlist/playlist.routes";

function createAPIV1Routes(ioc: Container): Router {
  const router = Router();

  router.use("/auth", createAuthRoutes(ioc));
  router.use("/genres", createPublicGenreRoutes(ioc));
  router.use("/payment", createPublicPaymentRoutes(ioc));

  (router.use(authMiddleware({ strict: true })), router.use(banMiddleware));
  router.use("/payment", createProtectedPaymentRoutes(ioc));
  router.use("/users", createUsersRoutes(ioc));
  router.use("/profile", createProfileRoutes(ioc));
  router.use("/genres", createProtectedGenreRoutes(ioc));
  router.use("/songs", createSongRoutes(ioc));
  router.use("/playlists", createPlaylistRoutes(ioc));

  return router;
}

async function createServer(ioc: Container) {
  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:5173"],
    }),
  );

  const paymentWebhookCtrl = ioc.get(PaymentController);
  app.post(
    "/payment-webhook",
    express.raw({ type: "application/json" }),
    paymentWebhookCtrl.webhookHandler,
  );

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: "20mb" }));
  app.use(express.static("storage"));

  app.use("/api/v1", createAPIV1Routes(ioc));

  // error handler
  app.use(errorMiddleware);

  return app;
}

export { createServer };
