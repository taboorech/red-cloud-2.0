import { Router } from "express";
import { Container } from "inversify";
import { SongController } from "./song.controller";
import { multerStorage } from "@app/lib/utils/multer";
import multer from "multer";
import { requireRole } from "@app/lib/utils/middlewares/user.middleware";
import { UserRole } from "@app/lib/enum/user.enum";

const createSongRoutes = (ioc: Container) => {
  const router = Router();

  const ctrl = ioc.get(SongController);

  const upload = multer({ storage: multerStorage });

  router.get("/favorites", ctrl.getFavoriteSongs);
  router.get(
    "/moderation",
    requireRole(UserRole.OPERATOR, UserRole.ADMIN),
    ctrl.listSongsForModeration,
  );
  router.put(
    "/:songId/moderation",
    requireRole(UserRole.OPERATOR, UserRole.ADMIN),
    ctrl.moderateUpdateSong,
  );
  router.delete(
    "/:songId/moderation",
    requireRole(UserRole.OPERATOR, UserRole.ADMIN),
    ctrl.moderateDeleteSong,
  );
  router.get("/:songId", ctrl.getSong);
  router.get("/", ctrl.getSongs);
  router.post(
    "/",
    upload.fields([
      { name: "song", maxCount: 1 },
      { name: "image", maxCount: 1 },
    ]),
    ctrl.createSong,
  );
  router.post("/:songId/favorite", ctrl.toggleFavoriteSong);
  router.post("/:songId/like", ctrl.likeSong);
  router.post("/:songId/dislike", ctrl.dislikeSong);
  router.put("/:songId", upload.single("image"), ctrl.updateSong);
  router.delete("/:songId", ctrl.deleteSong);

  return router;
};

export { createSongRoutes };
