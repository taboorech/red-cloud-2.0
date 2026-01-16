import { Container } from "inversify";
import { Router } from "express";
import { LyricsController } from "./lyrics.controller";

export function createLyricsRoutes(ioc: Container): Router {
  const router = Router();
  const ctrl = ioc.get(LyricsController);

  router.get("/languages", ctrl.getSupportedLanguages);

  router.get("/:songId", ctrl.getSongLyrics);

  router.get("/:songId/translate", ctrl.translateSongLyrics);

  return router;
}
