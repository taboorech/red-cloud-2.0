import { Router } from "express";
import { Container } from "inversify";
import { PlaylistController } from "./playlist.controller";
import multer from "multer";
import { multerStorage } from "@app/lib/utils/multer";

const createPlaylistRoutes = (ioc: Container) => {
  const router = Router();

  const ctrl = ioc.get(PlaylistController);

  const upload = multer({ storage: multerStorage });

  router.get("/:playlistId", ctrl.getPlaylistById);
  router.get("/", ctrl.getPlaylists);
  router.post("/", upload.single("image"), ctrl.createPlaylist);
  router.put("/:playlistId", upload.single("image"), ctrl.updatePlaylist);
  router.post("/:playlistId/songs/:songId/add", ctrl.addSongToPlaylist);
  router.post("/:playlistId/update-order", ctrl.updatePlaylistOrder);
  router.post("/:playlistId/songs/:songId/remove", ctrl.removeSongFromPlaylist);
  router.delete("/:playlistId", ctrl.deletePlaylist);

  return router;
};

export { createPlaylistRoutes };
