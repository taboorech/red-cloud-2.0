import { injectable } from "inversify";
import { AIModel, AIProvider } from "../constants/ai";
import { openAIClient } from "../openai/openai.client";
import { logger } from "../logger";
import fs from "fs";
import { storageFolder } from "../constants/app";
import { AppError } from "../errors/app.error";
import {
  AIGenerationRequest,
  AIGenerationResult,
  GeneratedImage,
} from "../types/ai";

@injectable()
export class AIService {
  constructor() {}

  public async generateImage({
    prompt,
    model = AIModel.GPT_IMAGE_1_MINI,
  }: AIGenerationRequest): Promise<AIGenerationResult> {
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

  private async saveBase64Image(result: GeneratedImage) {
    if (!fs.existsSync(storageFolder)) {
      fs.mkdirSync(storageFolder, { recursive: true });
    }

    if (result.b64_json) {
      try {
        const buffer = Buffer.from(result.b64_json, "base64");
        const filename = `${storageFolder}/${result.id}.png`;
        fs.writeFileSync(filename, buffer);

        result.url = `${result.id}.png`;
        logger().info(`Saved base64 image: ${filename}`);
      } catch (error) {
        logger().error(`Failed to save base64 image ${result.id}:`, error);
      }
    }
  }
}
