import { inject, injectable } from "inversify";
import { DeepLClient, LanguageOption } from "../deepl/deepl.client";
import { SongService } from "./song.service";
import { AppError } from "../errors/app.error";

export interface LyricsTranslationRequest {
  songId: number;
  targetLanguage: string;
}

export interface LyricsTranslationResult {
  songId: number;
  songTitle: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  detectedSourceLang?: string;
}

@injectable()
export class LyricsService {
  constructor(
    @inject(DeepLClient) private deepLClient: DeepLClient,
    @inject(SongService) private songService: SongService,
  ) {}

  public async getSongLyrics(userId: number, songId: number) {
    const song = await this.songService.getSong({ userId, songId });

    if (!song) {
      throw new AppError(404, "Song not found");
    }

    return {
      songId: song.id,
      title: song.title,
      lyrics: song.text || "",
      language: song.language || null,
      duration: song.duration_seconds,
      imageUrl: song.image_url,
    };
  }

  public async translateSongLyrics(
    userId: number,
    songId: number,
    targetLanguage: string,
  ): Promise<LyricsTranslationResult> {
    const song = await this.songService.getSong({ userId, songId });

    if (!song) {
      throw new AppError(404, "Song not found");
    }

    if (!song.text?.trim()) {
      throw new AppError(400, "Song has no lyrics to translate");
    }

    const translation = await this.deepLClient.translateText(
      song.text,
      targetLanguage,
      song.language || undefined,
    );

    return {
      songId: song.id,
      songTitle: song.title,
      originalText: song.text,
      translatedText: translation.translatedText,
      sourceLanguage: song.language || "unknown",
      targetLanguage,
      detectedSourceLang: translation.detectedSourceLang,
    };
  }

  public getSupportedLanguages(): {
    languages: LanguageOption[];
    total: number;
  } {
    const languages = this.deepLClient.getSupportedLanguages();
    return {
      languages,
      total: languages.length,
    };
  }
}
