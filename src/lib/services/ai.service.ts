import { injectable, inject } from "inversify";
import { AIModel, AIProvider } from "../constants/ai";
import { openAIClient } from "../openai/openai.client";
import { logger } from "../logger";
import fs from "fs";
import { storageFolder } from "../constants/app";
import { AppError } from "../errors/app.error";
import { buildFileUrl } from "../utils/file-save";
import { SongModel } from "../db/models/song.model";
import { GenreModel } from "../db/models/genres.model";
import { PlaylistItemModel } from "../db/models/playlist-item.model";
import { UserActivityService } from "./user-activity.service";
import { ContentType } from "../db/models/user-activity.model";
import { calculateCost } from "../utils/cost-calculator";
import {
  AIGenerationRequest,
  AIGenerationResult,
  GeneratedImage,
} from "../types/ai";
import { unlink } from "fs/promises";
import { PlaylistService } from "./playlist.service";
import { PlaylistModel } from "../db/models/playlists.model";

@injectable()
export class AIService {
  constructor(
    @inject(UserActivityService)
    private userActivityService: UserActivityService,
    @inject(PlaylistService) private playlistService: PlaylistService,
  ) {}

  public async generateImage(
    { prompt, model = AIModel.GPT_IMAGE_1_MINI }: AIGenerationRequest,
    userId?: number,
  ): Promise<AIGenerationResult> {
    logger().info(`Generating image with OpenAI:`, {
      prompt,
      model,
    });

    try {
      const response = await openAIClient().images.generate({
        model,
        prompt,
        n: 1,
      });

      if (!response || !response.data || !response.data.length) {
        throw new Error("Invalid response from OpenAI");
      }

      const imageData: GeneratedImage = {
        id: `openai-${Date.now()}`,
        b64_json: response.data[0].b64_json || undefined,
        revised_prompt: prompt,
      };

      await this.saveBase64Image(imageData);

      const cost = calculateCost({
        model,
        inputTokenCount: 0,
        outputTokenCount: 0,
        imageCount: 1,
      });

      if (userId) {
        await this.userActivityService.logActivity({
          userId,
          contentType: ContentType.COVER_GENERATION,
          result: imageData.url,
          inputTokens: 0,
          outputTokens: 0,
          cost,
          metadata: {
            objectId: imageData.id,
            prompt: prompt.substring(0, 100),
            model,
            provider: AIProvider.OPENAI,
          },
        });
      }

      logger().info(`Successfully generated 1 image with OpenAI`);

      return {
        provider: AIProvider.OPENAI,
        imageUrl: imageData.url,
        total: 1,
      };
    } catch (error) {
      logger().error("Error generating image with OpenAI:", error);
      throw new AppError(
        500,
        `Failed to generate image with OpenAI ${(error as Error).message}`,
      );
    }
  }

  public async generateLyrics(
    model: AIModel = AIModel.GPT_4O_TRANSCRIBE,
    audioFilePath?: string,
    songId?: number,
    userId?: number,
  ): Promise<string> {
    let audioUrl: string;
    let isUrl = false;

    if (songId) {
      logger().info(`Generating lyrics from song ID: ${songId}`);

      const song = await SongModel.query().findById(songId);
      if (!song) {
        throw new AppError(404, "Song not found");
      }

      audioUrl = song.url;
      isUrl = true;
    } else if (audioFilePath) {
      logger().info(`Generating lyrics from audio file: ${audioFilePath}`);
      audioUrl = audioFilePath;
    } else {
      throw new AppError(
        400,
        "Either audioFilePath or songId must be provided",
      );
    }

    let tempFilePath: string | null = null;

    try {
      let audioFile: fs.ReadStream;

      if (isUrl) {
        tempFilePath = await this.downloadAudioFile(audioUrl);
        audioFile = fs.createReadStream(tempFilePath);
      } else {
        // Local file path
        if (!fs.existsSync(audioUrl)) {
          throw new AppError(404, "Audio file not found");
        }
        audioFile = fs.createReadStream(audioUrl);
      }

      const response = await openAIClient().audio.transcriptions.create({
        file: audioFile,
        model,
        response_format: "text",
        temperature: 0,
        prompt:
          "Transcribe the complete audio file, including all lyrics and spoken content.",
      });

      if (!response) {
        throw new Error("Invalid response from OpenAI");
      }

      const estimatedInputTokens = 300;
      const estimatedOutputTokens = Math.ceil(response.length / 4); // ~4 chars per token
      const cost = calculateCost({
        model,
        inputTokenCount: estimatedInputTokens,
        outputTokenCount: estimatedOutputTokens,
        imageCount: 0,
      });

      if (userId) {
        await this.userActivityService.logActivity({
          userId,
          contentType: ContentType.LYRICS_TRANSCRIPTION,
          result: response,
          inputTokens: estimatedInputTokens,
          outputTokens: estimatedOutputTokens,
          cost,
          metadata: {
            objectId: songId?.toString(),
            model,
            provider: AIProvider.OPENAI,
            audioSource: isUrl ? "url" : "upload",
            textLength: response.length,
          },
        });
      }

      logger().info(`Successfully generated lyrics from audio`);

      return response;
    } catch (error) {
      logger().error("Error generating lyrics with OpenAI:", error);
      throw new AppError(
        500,
        `Failed to generate lyrics with OpenAI ${(error as Error).message}`,
      );
    } finally {
      // Clean up temp file if it was created
      if (tempFilePath) {
        try {
          await unlink(tempFilePath);
        } catch (cleanupError) {
          logger().error("Error cleaning up temp file:", cleanupError);
        }
      }
    }
  }

  public async generatePlaylistCover({
    playlistId,
    userId,
    userPrompt,
  }: {
    playlistId: number;
    userId: number;
    userPrompt?: string;
  }): Promise<string> {
    logger().info(`Generating playlist cover`, { playlistId, userId });

    const playlist = await this.playlistService.getPlaylistById({
      userId,
      playlistId,
      withSongs: false,
    });

    type SongWithGenres = SongModel & { genres: GenreModel[] };

    const songs = (await SongModel.query()
      .join(
        PlaylistItemModel.tableName,
        `${PlaylistItemModel.tableName}.song_id`,
        `${SongModel.tableName}.id`,
      )
      .where(`${PlaylistItemModel.tableName}.playlist_id`, playlistId)
      .withGraphFetched("genres")) as SongWithGenres[];

    logger().info(`Fetched ${songs.length} songs for playlist ${playlistId}`);

    const songTitles = songs.map((s) => s.title).join(", ");
    const genreNames = [
      ...new Set(songs.flatMap((s) => s.genres.map((g) => g.title))),
    ].join(", ");
    const lyricsSnippets = songs
      .filter((s) => s.text)
      .map((s) => `"${s.title}": ${s.text!.slice(0, 150)}`)
      .join("\n");

    const userMessage = [
      `Playlist: "${playlist.title}"`,
      genreNames ? `Genres: ${genreNames}` : "",
      songTitles ? `Track list: ${songTitles}` : "",
      lyricsSnippets
        ? `Lyrics (use these to extract the emotional core):\n${lyricsSnippets}`
        : "No lyrics available — rely on genres and track titles.",
    ]
      .filter(Boolean)
      .join("\n\n");

    let rawPrompt: string;

    if (userPrompt) {
      logger().info(`Using user-provided prompt for playlist ${playlistId}`);
      rawPrompt = userPrompt;
    } else {
      logger().info(`Requesting creative prompt from GPT`, { playlistId });

      const chatResponse = await openAIClient().chat.completions.create({
        model: AIModel.GPT_4O_MINI,
        messages: [
          {
            role: "system",
            content: `You are a creative art director for a music streaming platform.
Your job: write a DALL-E image generation prompt for a playlist cover.

Step-by-step thinking:
1. Extract dominant emotions and imagery from the lyrics (loneliness, joy, tension, nostalgia, etc.)
2. Translate genre into MOOD and COLOR PALETTE only — never into literal places or objects tied to the genre name
3. Choose a visual concept: an abstract scene, a landscape, a close-up texture, a surreal composition — whatever fits the emotional core

Visual style must be: modern digital art, cinematic, high-quality, sharp — NOT oil painting, NOT impressionism, NOT watercolor

Hard rules:
- ZERO text, letters, signs, words, or labels anywhere in the image
- Do NOT depict: bars, cafes, concert halls, stages — these are genre clichés
- Do NOT use the genre name as a literal visual element
- Avoid crowds and silhouettes of people unless truly essential
- Output ONLY the final image prompt, no commentary`,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        max_tokens: 350,
        temperature: 0.85,
      });

      rawPrompt =
        chatResponse.choices[0]?.message?.content?.trim() ?? userMessage;
    }

    const creativePrompt = `${rawPrompt} Style: modern digital art, cinematic lighting, sharp details, no text, no letters.`;

    logger().info(`Generated creative prompt for playlist ${playlistId}`, {
      prompt: creativePrompt,
    });

    const result = await this.generateImage({ prompt: creativePrompt }, userId);

    logger().info(`Playlist cover generated`, {
      playlistId,
      imageUrl: result.imageUrl,
    });

    return result.imageUrl!;
  }

  private async saveBase64Image(result: GeneratedImage) {
    if (!fs.existsSync(storageFolder)) {
      fs.mkdirSync(storageFolder, { recursive: true });
    }

    if (result.b64_json) {
      try {
        const buffer = Buffer.from(result.b64_json, "base64");
        const filename = `${storageFolder}/${result.id}.png`;
        fs.writeFileSync(filename, buffer);

        result.url = buildFileUrl(`${result.id}.png`);
        logger().info(`Saved base64 image: ${filename}`);
      } catch (error) {
        logger().error(`Failed to save base64 image ${result.id}:`, error);
      }
    }
  }

  private async downloadAudioFile(audioUrl: string): Promise<string> {
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new AppError(404, "Audio file not found at URL");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const urlParts = audioUrl.split(".");
    const extension =
      urlParts.length > 1 ? urlParts[urlParts.length - 1].split("?")[0] : "mp3";

    const tempFileName = `temp_audio_${Date.now()}_${Math.random().toString(36).substring(2)}.${extension}`;
    const tempFilePath = `${storageFolder}/${tempFileName}`;

    fs.writeFileSync(tempFilePath, buffer);

    return tempFilePath;
  }
}
