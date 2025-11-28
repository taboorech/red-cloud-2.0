import { injectable } from "inversify";
import { logger } from "../logger";
import Stripe from "stripe";
import {
  stripe,
  SubscriptionPlanType,
  subscriptionPlanTypeToId,
  SubscriptionStatus,
} from "../constants/payment";
import { AppError } from "../errors/app.error";
import { redis } from "../db/redis.client";
import { UserSubscriptionPlanModel } from "../db/models/user-subscription-plan.model";
import { SubscriptionPlanModel } from "../db/models/subscription-plan.model";
import { SubscriptionPlanPriceModel } from "../db/models/subscription-plan-price.model";
import dayjs from "dayjs";
import { UserModel } from "../db/models/user.model";

@injectable()
export class PaymentService {
  constructor() {}

  public async createCheckoutSession(
    userId: number,
    subscriptionPlanId: number,
    priceId: number,
  ): Promise<string> {
    const subscriptionPlan = await SubscriptionPlanModel.query()
      .findById(subscriptionPlanId)
      .where("is_active", true);

    if (!subscriptionPlan) {
      throw new AppError(404, "Subscription plan not found");
    }

    const price = await SubscriptionPlanPriceModel.query()
      .findById(priceId)
      .where("subscription_plan_id", subscriptionPlanId);

    if (!price) {
      throw new AppError(404, "Price not found");
    }

    const existingSubscription =
      await UserSubscriptionPlanModel.query().findOne({
        user_id: userId,
        status: SubscriptionStatus.ACTIVE,
      });

    if (
      existingSubscription &&
      existingSubscription.subscription_plan_id === subscriptionPlanId
    ) {
      throw new AppError(400, "User already has an active subscription");
    }

    const user = await UserModel.query().findById(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    let stripeCustomerId: string | null = await stripe()
      .customers.list({
        email: user.email,
        limit: 1,
      })
      .then((customers) =>
        customers.data.length > 0 ? customers.data[0].id : null,
      );

    if (!stripeCustomerId) {
      const customer = await stripe().customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });

      stripeCustomerId = customer.id;
    }

    const session = await stripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      customer: stripeCustomerId,
      // success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      // cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      success_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
      metadata: {
        userId: userId.toString(),
        subscriptionPlanId: subscriptionPlanId.toString(),
      },
    });

    if (!session.url) {
      throw new AppError(500, "Failed to create checkout session");
    }

    logger().info(`Checkout session created for user ${userId}: ${session.id}`);
    return session.url;
  }

  public async getPaymentUrl(
    userId: number,
    subscriptionPlanId: number,
    priceId: number,
  ): Promise<string> {
    return this.createCheckoutSession(userId, subscriptionPlanId, priceId);
  }

  public async cancelSubscription(userId: number): Promise<void> {
    await UserSubscriptionPlanModel.transaction(async (trx) => {
      const userSubscription = await UserSubscriptionPlanModel.query(
        trx,
      ).findOne({ user_id: userId, status: SubscriptionStatus.ACTIVE });

      if (!userSubscription) {
        throw new AppError(404, "Subscription not found");
      }
      if (userSubscription.stripe_subscription_id) {
        try {
          await stripe().subscriptions.update(
            userSubscription.stripe_subscription_id,
            {
              cancel_at_period_end: true,
            },
          );
          logger().info(
            `Stripe subscription ${userSubscription.stripe_subscription_id} will be canceled at period end`,
          );
        } catch (err) {
          logger().error("Failed to cancel Stripe subscription:", err);
          throw new AppError(500, "Failed to cancel subscription on Stripe");
        }
      }

      await UserSubscriptionPlanModel.query(trx)
        .patch({ status: SubscriptionStatus.CANCELED })
        .where("id", userSubscription.id);

      const foundFreePlan = await UserSubscriptionPlanModel.query(trx).findOne({
        user_id: userId,
        subscription_plan_id:
          subscriptionPlanTypeToId[SubscriptionPlanType.FREE],
      });

      if (!foundFreePlan) {
        await UserSubscriptionPlanModel.query(trx).insert({
          user_id: userId,
          subscription_plan_id:
            subscriptionPlanTypeToId[SubscriptionPlanType.FREE],
          started_at: dayjs().toDate(),
          current_period_start: dayjs().toDate(),
          current_period_end: null,
          trial_ends_at: null,
          status: SubscriptionStatus.ACTIVE,
          stripe_subscription_id: null,
        });
      } else {
        await UserSubscriptionPlanModel.query(trx)
          .patch({ status: SubscriptionStatus.ACTIVE })
          .where("id", foundFreePlan.id);
      }

      logger().info(`Subscription canceled for user ${userId}`);
    });
  }

  public async activateTrialPremium(userId: number): Promise<void> {
    await UserSubscriptionPlanModel.transaction(async (trx) => {
      const existingSubscription = await UserSubscriptionPlanModel.query(trx)
        .findOne({ user_id: userId })
        .where("status", SubscriptionStatus.ACTIVE)
        .andWhere(
          "subscription_plan_id",
          "!=",
          subscriptionPlanTypeToId[SubscriptionPlanType.FREE],
        );

      if (existingSubscription) {
        throw new AppError(400, "User already has an active subscription");
      }

      const trialDuration = parseInt(
        process.env.TRIAL_DURATION_DAYS || "7",
        10,
      );
      const trialEndDate = dayjs().add(trialDuration, "day").toDate();

      const userPremium = await UserSubscriptionPlanModel.query(trx).findOne({
        user_id: userId,
        subscription_plan_id:
          subscriptionPlanTypeToId[SubscriptionPlanType.PREMIUM],
      });

      if (
        userPremium?.trial_ends_at &&
        dayjs(userPremium.trial_ends_at).isAfter(dayjs())
      ) {
        throw new AppError(400, "User has already used the trial premium");
      }

      await UserSubscriptionPlanModel.query(trx)
        .patch({ status: SubscriptionStatus.CANCELED })
        .where("user_id", userId);

      if (userPremium) {
        await UserSubscriptionPlanModel.query(trx)
          .patch({
            started_at: dayjs().toDate(),
            current_period_start: dayjs().toDate(),
            current_period_end: trialEndDate,
            trial_ends_at: trialEndDate,
            status: SubscriptionStatus.ACTIVE,
          })
          .where("id", userPremium.id);

        logger().info(
          `Trial premium re-activated for user ${userId} until ${trialEndDate}`,
        );
        return;
      }

      await UserSubscriptionPlanModel.query(trx).insert({
        user_id: userId,
        subscription_plan_id:
          subscriptionPlanTypeToId[SubscriptionPlanType.PREMIUM],
        status: SubscriptionStatus.ACTIVE,
        started_at: dayjs().toDate(),
        current_period_start: dayjs().toDate(),
        current_period_end: trialEndDate,
        trial_ends_at: trialEndDate,
      });

      logger().info(
        `Trial premium activated for user ${userId} until ${trialEndDate}`,
      );
    });
  }

  public async getSubscriptionPlans() {
    const plans = await SubscriptionPlanModel.query()
      .where("is_active", true)
      .where("is_public", true)
      .withGraphFetched("prices")
      .orderBy("sort_order", "asc");

    return plans;
  }

  public async getCurrentUserSubscription(userId: number) {
    const subscription = await UserSubscriptionPlanModel.query()
      .findOne({ user_id: userId, status: SubscriptionStatus.ACTIVE })
      .withGraphFetched("subscription_plan.prices");

    return subscription;
  }

  public async webhookHandler(
    payload: Buffer,
    signature: string,
  ): Promise<void> {
    let event: Stripe.Event | undefined = undefined;
    try {
      event = stripe().webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      logger().error("Invalid Stripe signature:", err);
      throw new AppError(400, "Invalid Stripe signature");
    }

    const existsRedis = await redis().get(`stripe:webhook:event:${event.id}`);
    if (existsRedis) {
      logger().info(`Duplicate Stripe webhook event received: ${event.id}`);
      return;
    }

    try {
      switch (event.type) {
        case "invoice.payment_succeeded":
        case "checkout.session.completed":
        case "invoice.paid": {
          const session = event.data.object as Stripe.Checkout.Session;
          const { userId, subscriptionPlanId } = session.metadata || {};

          if (!userId) {
            logger().warn("No user id in session metadata");
            return;
          }

          let stripeSubscriptionId: string | null = null;
          if (session.subscription) {
            stripeSubscriptionId =
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription.id;
          }

          const currentPeriodStartDate = dayjs().toDate();
          const currentPeriodEndDate = dayjs().add(1, "month").toDate();

          const userSubscriptions =
            await UserSubscriptionPlanModel.query().where({
              user_id: parseInt(userId, 10),
            });

          const createNewRecord = async () => {
            await UserSubscriptionPlanModel.query().insert({
              user_id: parseInt(userId, 10),
              subscription_plan_id: parseInt(subscriptionPlanId, 10),
              started_at: currentPeriodStartDate,
              status: SubscriptionStatus.ACTIVE,
              stripe_subscription_id: stripeSubscriptionId,
              current_period_start: currentPeriodStartDate,
              current_period_end: currentPeriodEndDate,
              trial_ends_at: null,
            });
          };

          if (!userSubscriptions.length) {
            await createNewRecord();

            logger().info(
              `New subscription created for user ${userId} with Stripe ID ${stripeSubscriptionId}`,
            );
            break;
          }

          const foundSameSubscription = userSubscriptions.find(
            (sub) =>
              sub.subscription_plan_id === parseInt(subscriptionPlanId, 10),
          );

          await UserSubscriptionPlanModel.query()
            .patch({ status: SubscriptionStatus.CANCELED })
            .where("user_id", parseInt(userId, 10));

          if (!foundSameSubscription) {
            await createNewRecord();

            logger().info(
              `New subscription created for user ${userId} with Stripe ID ${stripeSubscriptionId}`,
            );
            break;
          }

          await UserSubscriptionPlanModel.query()
            .patch({
              stripe_subscription_id: stripeSubscriptionId,
              current_period_start: currentPeriodStartDate,
              current_period_end: currentPeriodEndDate,
              status: SubscriptionStatus.ACTIVE,
            })
            .where("id", foundSameSubscription.id);

          logger().info(
            `Subscription updated for user ${userId}, subscription ${foundSameSubscription.id} with Stripe ID ${stripeSubscriptionId}`,
          );

          break;
        }

        default:
          logger().info(`Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      logger().error("Webhook processing error:", err);
      throw err;
    }
  }
}
