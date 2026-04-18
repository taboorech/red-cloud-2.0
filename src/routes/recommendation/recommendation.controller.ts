import { RecommendationService } from "@app/lib/services/recommendation.service";
import { getRecommendationsSchema } from "@app/lib/validation/recommendation.scheme";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class RecommendationController {
  constructor(
    @inject(RecommendationService)
    private recommendationService: RecommendationService,
  ) {
    this.getRecommendations = this.getRecommendations.bind(this);
  }

  public async getRecommendations(req: Request, res: Response) {
    const { strategy, limit, offset } = getRecommendationsSchema.parse(
      req.query,
    );

    const songs = await this.recommendationService.getRecommendations({
      userId: req.user!.id,
      strategy,
      limit,
      offset,
    });

    res.json({ status: "OK", data: songs });
  }
}
