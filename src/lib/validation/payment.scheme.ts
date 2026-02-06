import { z as zod } from "zod";

const paymentSchema = zod.object({
  subscriptionPlanId: zod.coerce.number().int().positive(),
  priceId: zod.coerce.number().int().positive(),
});

export const createCheckoutSessionSchema = paymentSchema;

export const getPaymentUrlSchema = paymentSchema;
