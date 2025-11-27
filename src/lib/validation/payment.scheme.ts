import { z as zod } from "zod";

const paymentSchema = zod.object({
  subscriptionPlanId: zod.number().int().positive(),
  priceId: zod.number().int().positive(),
});

export const createCheckoutSessionSchema = paymentSchema;

export const getPaymentUrlSchema = paymentSchema;
