import Stripe from "stripe";

export enum PaymentInterval {
  MONTH = "month",
  YEAR = "year",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELED = "canceled",
  TRIALING = "trialing",
}

export enum SubscriptionPlanType {
  FREE = "free",
  PREMIUM = "premium",
}

export const subscriptionPlanTypeToId: Record<SubscriptionPlanType, number> = {
  [SubscriptionPlanType.FREE]: 1,
  [SubscriptionPlanType.PREMIUM]: 2,
};

export enum PaymentWebhookHandler {
  SUBSCRIPTION_BUY = "subscription_buy",
  INVOICE_FAILED = "invoice_failed",
  INVOICE_UPCOMING = "invoice_upcoming",
  TRIAL_WILL_END = "trial_will_end",
}

const __stripeClient: Stripe | undefined = undefined;

export function stripe(): Stripe {
  if (__stripeClient) {
    return __stripeClient;
  }

  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

  return stripeClient;
}
