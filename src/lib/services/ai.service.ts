import { injectable, inject } from "inversify";
import { AIModel, AIProvider } from "../constants/ai";
import { openAIClient } from "../openai/openai.client";
import { logger } from "../logger";
import fs from "fs";
import { storageFolder } from "../constants/app";
import { AppError } from "../errors/app.error";
import { buildFileUrl } from "../utils/file-save";
import { SongModel } from "../db/models/song.model";
import { UserActivityService } from "./user-activity.service";
import { ContentType } from "../db/models/user-activity.model";
import { calculateCost } from "../utils/cost-calculator";
import {
  AIGenerationRequest,
  AIGenerationResult,
  GeneratedImage,
} from "../types/ai";
import { unlink } from "fs/promises";

@injectable()
export class AIService {
  constructor(
    @inject(UserActivityService)
    private userActivityService: UserActivityService,
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

  public async generateLyricsWithAudioFile(
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
