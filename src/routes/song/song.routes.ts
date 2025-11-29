import { Router } from "express";
import { Container } from "inversify";
import { SongController } from "./song.controller";
import { multerStorage } from "@app/lib/utils/multer";
import multer from "multer";

const createSongRoutes = (ioc: Container) => {
  const router = Router();

  const ctrl = ioc.get(SongController);

  const upload = multer({ storage: multerStorage });

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
  router.put("/:songId", upload.single("image"), ctrl.updateSong);
  router.delete("/:songId", ctrl.deleteSong);

  return router;
};

export { createSongRoutes };
