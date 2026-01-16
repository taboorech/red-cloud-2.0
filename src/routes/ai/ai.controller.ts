import { AIService } from "@app/lib/services/ai.service";
import { generateImageSchema } from "@app/lib/validation/ai.scheme";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class AIController {
  constructor(@inject(AIService) private aiService: AIService) {
    this.generateImage = this.generateImage.bind(this);
  }

  public async generateImage(req: Request, res: Response) {
    const validatedData = generateImageSchema.parse(req.body);
    const aiResponse = await this.aiService.generateImage(validatedData);

    res.json({ status: "OK", data: aiResponse });
  }
}
