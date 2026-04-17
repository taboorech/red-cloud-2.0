import { AIService } from "@app/lib/services/ai.service";
import { UserActivityService } from "@app/lib/services/user-activity.service";
import {
  generateImageSchema,
  getUserActivityQuerySchema,
  getAdminUsersActivityQuerySchema,
  generateLyricsSchema,
  generatePlaylistCoverSchema,
} from "@app/lib/validation/ai.scheme";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import dayjs from "dayjs";

@injectable()
export class AIController {
  constructor(
    @inject(AIService) private aiService: AIService,
    @inject(UserActivityService)
    private userActivityService: UserActivityService,
  ) {
    this.generateImage = this.generateImage.bind(this);
    this.generateLyrics = this.generateLyrics.bind(this);
    this.generatePlaylistCover = this.generatePlaylistCover.bind(this);
    this.getUserActivity = this.getUserActivity.bind(this);
    this.getAdminUsersActivity = this.getAdminUsersActivity.bind(this);
  }

  public async generateImage(req: Request, res: Response) {
    const validatedData = generateImageSchema.parse(req.body);
    const userId = req.user?.id;

    const aiResponse = await this.aiService.generateImage(
      validatedData,
      userId,
    );

    res.json({ status: "OK", data: aiResponse });
  }

  public async generatePlaylistCover(req: Request, res: Response) {
    const { playlistId } = generatePlaylistCoverSchema.parse(req.params);
    const userId = req.user!.id;

    const imageUrl = await this.aiService.generatePlaylistCover(playlistId, userId);

    res.json({ status: "OK", data: imageUrl });
  }

  public async generateLyrics(req: Request, res: Response) {
    const { audioFile, songId, model } = generateLyricsSchema.parse({
      audioFile: req.file?.path,
      songId: req.body?.songId ? parseInt(req.body.songId) : undefined,
      model: req.body?.model,
    });

    const userId = req.user?.id;

    const aiResponse = await this.aiService.generateLyrics(
      model,
      audioFile,
      songId,
      userId,
    );

    res.json({ status: "OK", data: aiResponse });
  }

  public async getUserActivity(req: Request, res: Response) {
    const { userId, ...validatedQuery } = getUserActivityQuerySchema.parse({
      ...req.query,
      userId: req.user?.id,
    });

    const options = {
      contentType: validatedQuery.contentType,
      limit: validatedQuery.limit,
      offset: validatedQuery.offset,
      startDate: validatedQuery.startDate
        ? dayjs(validatedQuery.startDate).toDate()
        : undefined,
      endDate: validatedQuery.endDate
        ? dayjs(validatedQuery.endDate).toDate()
        : undefined,
    };

    const [activities, stats, costStats] = await Promise.all([
      this.userActivityService.getUserActivities(userId, options),
      this.userActivityService.getUserActivityStats(
        userId,
        options.startDate,
        options.endDate,
      ),
      this.userActivityService.getUserTotalCost(
        userId,
        options.contentType,
        options.startDate,
        options.endDate,
      ),
    ]);

    res.json({
      status: "OK",
      data: {
        activities,
        stats,
        costStats,
        total: activities.length,
      },
    });
  }

  public async getAdminUsersActivity(req: Request, res: Response) {
    const validatedQuery = getAdminUsersActivityQuerySchema.parse(req.query);

    const options = {
      contentType: validatedQuery.contentType,
      startDate: validatedQuery.startDate
        ? dayjs(validatedQuery.startDate).toDate()
        : undefined,
      endDate: validatedQuery.endDate
        ? dayjs(validatedQuery.endDate).toDate()
        : undefined,
    };

    const [usersStats, allActivities] = await Promise.all([
      this.userActivityService.getAllUsersActivityStats(
        options.contentType,
        options.startDate,
        options.endDate,
      ),
      this.userActivityService.getAllUsersActivities(options),
    ]);

    const totalStats = usersStats.reduce(
      (acc, user) => ({
        totalCost: acc.totalCost + user.totalCost,
        totalTokens: {
          input: acc.totalTokens.input + user.totalTokens.input,
          output: acc.totalTokens.output + user.totalTokens.output,
        },
        totalActivities: acc.totalActivities + user.activityCount,
        totalUsers: acc.totalUsers + 1,
      }),
      {
        totalCost: 0,
        totalTokens: { input: 0, output: 0 },
        totalActivities: 0,
        totalUsers: 0,
      },
    );

    res.json({
      status: "OK",
      data: {
        activities: allActivities,
        userStats: usersStats,
        totalStats,
        total: allActivities.length,
      },
    });
  }
}
