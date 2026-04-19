import { Router } from "express";
import { Container } from "inversify";
import { AIController } from "./ai.controller";
import multer from "multer";
import { multerStorage } from "@app/lib/utils/multer";
import { requireRole } from "@app/lib/utils/middlewares/user.middleware";
import { UserRole } from "@app/lib/enum/user.enum";
import { requireSubscription } from "@app/lib/utils/middlewares/subscription.middleware";

const createAIRoutes = (ioc: Container): Router => {
  const router = Router();

  const upload = multer({ storage: multerStorage });
  const ctrl = ioc.get(AIController);

  router.post("/generate-image", requireSubscription(), ctrl.generateImage);
  router.post("/songs/:songId/embed", ctrl.generateSongEmbedding);
  router.post(
    "/playlists/:playlistId/generate-cover",
    requireSubscription(),
    ctrl.generatePlaylistCover,
  );
  router.post(
    "/generate-lyrics",
    requireSubscription(),
    upload.single("audioFile"),
    ctrl.generateLyrics,
  );
  router.get("/user-activity", ctrl.getUserActivity);
  router.get(
    "/users-activity",
    requireRole(UserRole.ADMIN),
    ctrl.getAdminUsersActivity,
  );

  return router;
};

export { createAIRoutes };
