import { injectable } from "inversify";
import { UserActivityModel, ContentType, IUserActivityMetadata } from "../db/models/user-activity.model";
import { logger } from "../logger";

export interface CreateActivityParams {
  userId: number;
  contentType: ContentType;
  result?: string;
  metadata?: IUserActivityMetadata;
}

@injectable()
export class UserActivityService {
  constructor() {}

  public async logActivity(params: CreateActivityParams): Promise<UserActivityModel> {
    const activity = await UserActivityModel.query().insert({
      user_id: params.userId,
      content_type: params.contentType,
      result: params.result,
      metadata: params.metadata,
    });

    logger().info("User activity logged", {
      id: activity.id,
      userId: params.userId,
      contentType: params.contentType,
      hasResult: !!params.result,
    });

    return activity;
  }

  public async getUserActivities(
    userId: number,
    options: {
      contentType?: ContentType;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<UserActivityModel[]> {
    const activity = await UserActivityModel.query()
      .where("user_id", userId)
      .orderBy("created_at", "desc")
      .modify((builder) => {
        if (options.contentType) {
          builder.where("content_type", options.contentType);
        }

        if (options.startDate) {
          builder.where("created_at", ">=", options.startDate);
        }

        if (options.endDate) {
          builder.where("created_at", "<=", options.endDate);
        }

        if (options.limit) {
          builder.limit(options.limit);
        }

        if (options.offset) {
          builder.offset(options.offset);
        }
      })

    return activity;
  }

  public async getUserActivityStats(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ content_type: string; count: string }>> {
    const activity = await UserActivityModel.query()
      .where("user_id", userId)
      .select("content_type")
      .modify((builder) => {
        if (startDate) {
          builder.where("created_at", ">=", startDate);
        }

        if (endDate) {
          builder.where("created_at", "<=", endDate);
        }
      })
      .count("* as count")
      .groupBy("content_type")

    return activity as unknown as Array<{ content_type: string; count: string }>;
  }
}