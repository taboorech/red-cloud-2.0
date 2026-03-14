import { injectable } from "inversify";
import {
  UserActivityModel,
  ContentType,
  IUserActivityMetadata,
} from "../db/models/user-activity.model";
import { logger } from "../logger";

export interface CreateActivityParams {
  userId: number;
  contentType: ContentType;
  result?: string;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  metadata?: IUserActivityMetadata;
}

@injectable()
export class UserActivityService {
  constructor() {}

  public async logActivity(
    params: CreateActivityParams,
  ): Promise<UserActivityModel> {
    const activity = await UserActivityModel.query().insert({
      user_id: params.userId,
      content_type: params.contentType,
      result: params.result,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      cost: params.cost,
      metadata: params.metadata,
    });

    logger().info("User activity logged", {
      id: activity.id,
      userId: params.userId,
      contentType: params.contentType,
      hasResult: !!params.result,
      cost: params.cost,
      tokens: {
        input: params.inputTokens,
        output: params.outputTokens,
      },
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
    } = {},
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
      });

    return activity;
  }

  public async getUserActivityStats(
    userId: number,
    startDate?: Date,
    endDate?: Date,
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
      .groupBy("content_type");

    return activity as unknown as Array<{
      content_type: string;
      count: string;
    }>;
  }

  public async getUserTotalCost(
    userId: number,
    contentType?: ContentType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalCost: number;
    totalTokens: { input: number; output: number };
  }> {
    const query = UserActivityModel.query()
      .where("user_id", userId)
      .whereNotNull("cost");

    if (contentType) {
      query.where("content_type", contentType);
    }

    if (startDate) {
      query.where("created_at", ">=", startDate);
    }

    if (endDate) {
      query.where("created_at", "<=", endDate);
    }

    const result = (await query
      .sum("cost as totalCost")
      .sum("input_tokens as totalInputTokens")
      .sum("output_tokens as totalOutputTokens")
      .first()) as any;

    return {
      totalCost: parseFloat(result?.totalCost || "0"),
      totalTokens: {
        input: parseInt(result?.totalInputTokens || "0"),
        output: parseInt(result?.totalOutputTokens || "0"),
      },
    };
  }

  public async getAllUsersActivityStats(
    contentType?: ContentType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      userId: number;
      totalCost: number;
      totalTokens: { input: number; output: number };
      activityCount: number;
    }>
  > {
    const activity = await UserActivityModel.query()
      .select("user_id")
      .sum("cost as totalCost")
      .sum("input_tokens as totalInputTokens")
      .sum("output_tokens as totalOutputTokens")
      .count("* as activityCount")
      .whereNotNull("cost")
      .groupBy("user_id")
      .modify((builder) => {
        if (contentType) {
          builder.where("content_type", contentType);
        }

        if (startDate) {
          builder.where("created_at", ">=", startDate);
        }

        if (endDate) {
          builder.where("created_at", "<=", endDate);
        }
      });

    return activity.map((result: any) => ({
      userId: result.user_id,
      totalCost: parseFloat(result.totalCost || "0"),
      totalTokens: {
        input: parseInt(result.totalInputTokens || "0"),
        output: parseInt(result.totalOutputTokens || "0"),
      },
      activityCount: parseInt(result.activityCount || "0"),
    }));
  }

  public async getAllUsersActivities(
    options: {
      contentType?: ContentType;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<UserActivityModel[]> {
    const activity = await UserActivityModel.query()
      .withGraphFetched("user")
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
      });

    return activity;
  }
}
