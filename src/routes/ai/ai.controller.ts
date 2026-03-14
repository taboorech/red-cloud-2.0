import { AIService } from "@app/lib/services/ai.service";
import { UserActivityService } from "@app/lib/services/user-activity.service";
import {
  generateImageSchema,
  generateLyricsWithAudioFileSchema,
  getUserActivityQuerySchema,
} from "@app/lib/validation/ai.scheme";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import dayjs from "dayjs";

@injectable()
export class AIController {
  constructor(
    @inject(AIService) private aiService: AIService,
    @inject(UserActivityService) private userActivityService: UserActivityService
  ) {
    this.generateImage = this.generateImage.bind(this);
    this.generateLyrics = this.generateLyrics.bind(this);
    this.getUserActivity = this.getUserActivity.bind(this);
  }

  public async generateImage(req: Request, res: Response) {
    const validatedData = generateImageSchema.parse(req.body);
    const userId = req.user?.id;

    const aiResponse = await this.aiService.generateImage(validatedData, userId);

    res.json({ status: "OK", data: aiResponse });
  }

  public async generateLyrics(req: Request, res: Response) {
    const { audioFile, songId, model } =
      generateLyricsWithAudioFileSchema.parse({
        audioFile: req.file?.path,
        songId: req.body?.songId ? parseInt(req.body.songId) : undefined,
        model: req.body?.model,
      });

    const userId = req.user?.id;
    
    const aiResponse = await this.aiService.generateLyricsWithAudioFile(
      model,
      audioFile,
      songId,
      userId,
    );

    res.json({ status: "OK", data: aiResponse });
  }

  public async getUserActivity(req: Request, res: Response) {
    const { userId, ...validatedQuery } = getUserActivityQuerySchema.parse({ ...req.query, userId: req.user?.id });
    
    const options = {
      contentType: validatedQuery.contentType,
      limit: validatedQuery.limit,
      offset: validatedQuery.offset,
      startDate: validatedQuery.startDate ? dayjs(validatedQuery.startDate).toDate() : undefined,
      endDate: validatedQuery.endDate ? dayjs(validatedQuery.endDate).toDate() : undefined,
    };

    const [activities, stats] = await Promise.all([
      this.userActivityService.getUserActivities(userId, options),
      this.userActivityService.getUserActivityStats(userId, options.startDate, options.endDate)
    ]);

    res.json({
      status: "OK",
      data: {
        activities,
        stats,
        total: activities.length
      }
    });
  }
}
