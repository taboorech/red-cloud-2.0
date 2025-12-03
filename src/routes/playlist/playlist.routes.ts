import { Router } from "express";
import { Container } from "inversify";
import { PlaylistController } from "./playlist.controller";

const createPlaylistRoutes = (ioc: Container) => {
  const router = Router();

  const ctrl = ioc.get(PlaylistController);

  router.get("/:playlistId", ctrl.getPlaylistById);
  router.get("/", ctrl.getPlaylists);
  router.post("/", ctrl.createPlaylist);
  router.put("/:playlistId", ctrl.updatePlaylist);
  router.post("/:playlistId/songs/:songId/add", ctrl.addSongToPlaylist);
  router.post("/:playlistId/update-order", ctrl.updatePlaylistOrder);
  router.post("/:playlistId/songs/:songId/remove", ctrl.removeSongFromPlaylist);
  router.delete("/:playlistId", ctrl.deletePlaylist);

  return router;
};

export { createPlaylistRoutes };
