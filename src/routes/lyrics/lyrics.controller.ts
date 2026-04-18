import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { LyricsService } from "../../lib/services/lyrics.service";
import {
  getSongLyricsSchema,
  translateSongLyricsSchema,
} from "../../lib/validation/lyrics.scheme";

@injectable()
export class LyricsController {
  constructor(@inject(LyricsService) private lyricsService: LyricsService) {
    this.getSongLyrics = this.getSongLyrics.bind(this);
    this.translateSongLyrics = this.translateSongLyrics.bind(this);
    this.getSupportedLanguages = this.getSupportedLanguages.bind(this);
    this.getUserTranslation = this.getUserTranslation.bind(this);
  }

  public async getSongLyrics(req: Request, res: Response): Promise<void> {
    const { songId } = getSongLyricsSchema.parse(req.params);
    const userId = req.user!.id;

    const lyrics = await this.lyricsService.getSongLyrics(userId, songId);

    res.json({
      status: "OK",
      data: lyrics,
    });
  }

  public async translateSongLyrics(req: Request, res: Response): Promise<void> {
    const { songId, targetLanguage } = translateSongLyricsSchema.parse({
      ...req.params,
      ...req.query,
    });
    const userId = req.user!.id;

    const translation = await this.lyricsService.translateSongLyrics(
      userId,
      songId,
      targetLanguage,
    );

    res.json({
      status: "OK",
      data: translation,
    });
  }

  public async getUserTranslation(req: Request, res: Response): Promise<void> {
    const { songId, targetLanguage } = translateSongLyricsSchema.parse({
      ...req.params,
      ...req.query,
    });
    const userId = req.user!.id;

    const translation = await this.lyricsService.getUserTranslation(
      userId,
      songId,
      targetLanguage,
    );

    res.json({ status: "OK", data: translation });
  }

  public async getSupportedLanguages(
    req: Request,
    res: Response,
  ): Promise<void> {
    const languages = this.lyricsService.getSupportedLanguages();

    res.json({
      status: "OK",
      data: languages,
    });
  }
}
