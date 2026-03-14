import { AIService } from "@app/lib/services/ai.service";
import {
  generateImageSchema,
  generateLyricsWithAudioFileSchema,
} from "@app/lib/validation/ai.scheme";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class AIController {
  constructor(@inject(AIService) private aiService: AIService) {
    this.generateImage = this.generateImage.bind(this);
    this.generateLyrics = this.generateLyrics.bind(this);
  }

  public async generateImage(req: Request, res: Response) {
    const validatedData = generateImageSchema.parse(req.body);
    const aiResponse = await this.aiService.generateImage(validatedData);

    res.json({ status: "OK", data: aiResponse });
  }

  public async generateLyrics(req: Request, res: Response) {
    const { audioFile, songId, model } =
      generateLyricsWithAudioFileSchema.parse({
        audioFile: req.file?.path,
        songId: req.body?.songId ? parseInt(req.body.songId) : undefined,
        model: req.body?.model,
      });

    const aiResponse = await this.aiService.generateLyricsWithAudioFile(
      model,
      audioFile,
      songId,
    );

    res.json({ status: "OK", data: aiResponse });
  }
}
