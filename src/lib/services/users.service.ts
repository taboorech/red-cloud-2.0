import z from "zod";
import { UserListItem, UserModel } from "../db/models/user.model";
import { paginationValidation } from "../validation/main.scheme";
import { injectable } from "inversify";
import {
  changeUserAccessValidation,
  giftSubscriptionValidation,
  setUserSubscriptionValidation,
  updateUserRoleValidation,
} from "../validation/users.scheme";
import { UserAccess, UserRole } from "../enum/user.enum";
import { UserBansModel } from "../db/models/user-bans.model";
import { SubscriptionPlanModel } from "../db/models/subscription-plan.model";
import { UserSubscriptionPlanModel } from "../db/models/user-subscription-plan.model";
import { stripe, SubscriptionStatus } from "../constants/payment";
import { AppError } from "../errors/app.error";
import { logger } from "../logger";
import dayjs from "dayjs";

@injectable()
export default class UsersService {
  constructor() {}

  public async getAllUsers({
    offset,
    limit,
    search,
    ids,
  }: z.infer<typeof paginationValidation>): Promise<UserModel[]> {
    const users = await UserModel.query()
      .withGraphFetched("userBans")
      .modify((builder) => {
        if (ids?.length) builder.whereIn("id", ids);

        if (offset) builder.offset(offset);

        if (limit) builder.limit(limit);

        if (search)
          builder
            .whereILike("email", `%${search}%`)
            .orWhereILike("username", `%${search}%`);
      })
      .orderBy("id");

    return users;
  }

  public async getActiveSubscriptionMap(
    userIds: number[],
  ): Promise<Map<number, NonNullable<UserListItem["subscription"]>>> {
    if (userIds.length === 0) return new Map();

    const rows = (await UserSubscriptionPlanModel.query()
      .whereIn("user_id", userIds)
      .andWhere("status", SubscriptionStatus.ACTIVE)
      .withGraphFetched("subscription_plan")) as Array<
      UserSubscriptionPlanModel & { subscription_plan?: SubscriptionPlanModel }
    >;

    const map = new Map<number, NonNullable<UserListItem["subscription"]>>();
    for (const r of rows) {
      map.set(r.user_id, {
        plan_id: r.subscription_plan_id,
        plan_title: r.subscription_plan?.title ?? null,
        expires_at: r.current_period_end
          ? dayjs(r.current_period_end).toISOString()
          : null,
        status: r.status,
      });
    }
    return map;
  }

  public async setUserSubscription(
    {
      userId,
      planId,
      expiresAt,
    }: z.infer<typeof setUserSubscriptionValidation>,
    viewerId: number,
  ): Promise<void> {
    const target = await UserModel.query().findOne({ id: userId });
    if (!target) {
      throw new AppError(404, "User not found");
    }

    if (target.role === UserRole.OWNER && Number(target.id) !== viewerId) {
      throw new AppError(403, "Cannot modify owner's subscription");
    }

    const planRow = await SubscriptionPlanModel.query().findById(planId);
    if (!planRow) {
      throw new AppError(404, `Subscription plan ${planId} not found`);
    }

    let periodEnd: Date | null = null;
    if (expiresAt) {
      const parsed = dayjs(expiresAt);
      if (!parsed.isValid() || parsed.isBefore(dayjs())) {
        throw new AppError(400, "expiresAt must be a valid future date");
      }
      periodEnd = parsed.toDate();
    }

    await UserSubscriptionPlanModel.transaction(async (trx) => {
      const liveStripeSubs = await UserSubscriptionPlanModel.query(trx)
        .where("user_id", userId)
        .andWhere("status", SubscriptionStatus.ACTIVE)
        .whereNotNull("stripe_subscription_id");

      for (const sub of liveStripeSubs) {
        if (!sub.stripe_subscription_id) continue;
        try {
          await stripe().subscriptions.update(sub.stripe_subscription_id, {
            cancel_at_period_end: true,
          });
          logger().info(
            `[ADMIN OVERRIDE] Stripe subscription ${sub.stripe_subscription_id} marked for cancel at period end (user ${userId})`,
          );
        } catch (err) {
          logger().error(
            "[ADMIN OVERRIDE] Failed to cancel Stripe subscription:",
            err,
          );
          throw new AppError(500, "Failed to cancel subscription on Stripe");
        }
      }

      await UserSubscriptionPlanModel.query(trx)
        .patch({ status: SubscriptionStatus.CANCELED })
        .where("user_id", userId)
        .andWhere("status", SubscriptionStatus.ACTIVE);

      const existingForPlan = await UserSubscriptionPlanModel.query(
        trx,
      ).findOne({
        user_id: userId,
        subscription_plan_id: planRow.id,
      });

      if (existingForPlan) {
        await UserSubscriptionPlanModel.query(trx)
          .patch({
            started_at: dayjs().toDate(),
            current_period_start: dayjs().toDate(),
            current_period_end: periodEnd,
            status: SubscriptionStatus.ACTIVE,
            stripe_subscription_id: null,
          })
          .where("id", existingForPlan.id);
      } else {
        await UserSubscriptionPlanModel.query(trx).insert({
          user_id: userId,
          subscription_plan_id: planRow.id,
          started_at: dayjs().toDate(),
          current_period_start: dayjs().toDate(),
          current_period_end: periodEnd,
          status: SubscriptionStatus.ACTIVE,
          stripe_subscription_id: null,
        });
      }
    });
  }

  public async giftSubscription(
    { userId, planId, days }: z.infer<typeof giftSubscriptionValidation>,
    viewerId: number,
  ): Promise<void> {
    const target = await UserModel.query().findOne({ id: userId });
    if (!target) {
      throw new AppError(404, "User not found");
    }
    if (target.role === UserRole.OWNER && Number(target.id) !== viewerId) {
      throw new AppError(403, "Cannot modify owner's subscription");
    }

    const active = await UserSubscriptionPlanModel.query().findOne({
      user_id: userId,
      status: SubscriptionStatus.ACTIVE,
    });

    if (active) {
      if (active.stripe_subscription_id) {
        try {
          await stripe().subscriptions.update(active.stripe_subscription_id, {
            cancel_at_period_end: true,
          });
          logger().info(
            `[ADMIN GIFT] Stripe subscription ${active.stripe_subscription_id} marked for cancel at period end (user ${userId})`,
          );
        } catch (err) {
          logger().error(
            "[ADMIN GIFT] Failed to cancel Stripe subscription:",
            err,
          );
          throw new AppError(500, "Failed to cancel subscription on Stripe");
        }
      }

      if (days === null) {
        await UserSubscriptionPlanModel.query()
          .patch({
            current_period_end: null,
            stripe_subscription_id: null,
          })
          .where("id", active.id);
        return;
      }

      if (!active.current_period_end) {
        throw new AppError(
          400,
          "Subscription is already permanent — nothing to extend",
        );
      }

      const newEnd = dayjs(active.current_period_end).add(days, "day").toDate();
      await UserSubscriptionPlanModel.query()
        .patch({
          current_period_end: newEnd,
          stripe_subscription_id: null,
        })
        .where("id", active.id);
      return;
    }

    if (!planId) {
      throw new AppError(
        400,
        "User has no active subscription; planId is required to start one",
      );
    }
    const planRow = await SubscriptionPlanModel.query().findById(planId);
    if (!planRow) {
      throw new AppError(404, `Subscription plan ${planId} not found`);
    }
    const periodEnd = days === null ? null : dayjs().add(days, "day").toDate();
    await UserSubscriptionPlanModel.query().insert({
      user_id: userId,
      subscription_plan_id: planRow.id,
      started_at: dayjs().toDate(),
      current_period_start: dayjs().toDate(),
      current_period_end: periodEnd,
      status: SubscriptionStatus.ACTIVE,
      stripe_subscription_id: null,
    });
  }

  public async updateUserRole({
    userId,
    role,
  }: z.infer<typeof updateUserRoleValidation>): Promise<void> {
    const target = await UserModel.query().findOne({ id: userId });
    if (!target) {
      throw new AppError(404, "User not found");
    }
    if (target.role === UserRole.OWNER) {
      throw new AppError(403, "Cannot modify owner's role");
    }
    await UserModel.query()
      .update({
        role,
      })
      .where({
        id: userId,
      });
  }

  public async changeUserAccess({
    userId,
    action,
  }: z.infer<typeof changeUserAccessValidation>): Promise<void> {
    const user = await UserModel.query().findOne({
      id: userId,
    });
    if (!user) {
      throw new AppError(404, "User not found");
    }
    if (user.role === UserRole.OWNER) {
      throw new AppError(403, "Cannot change access of an owner");
    }

    const banRecord = await UserBansModel.query().findOne({
      user_id: user.id,
    });

    if (action === UserAccess.BAN) {
      if (banRecord && banRecord.is_banned) {
        throw new AppError(400, "User is already banned");
      }

      if (banRecord) {
        await UserBansModel.query()
          .update({
            is_banned: true,
            banned_at: dayjs().toDate(),
          })
          .where({
            id: banRecord.id,
          });
      } else {
        await UserBansModel.query().insert({
          user_id: user.id,
          is_banned: true,
          banned_at: dayjs().toDate(),
        });
      }
    } else {
      if (!banRecord || !banRecord.is_banned) {
        throw new AppError(400, "User is not banned");
      }

      await UserBansModel.query()
        .update({
          is_banned: false,
          banned_at: null,
        })
        .where({
          id: banRecord.id,
        });
    }
  }
}
