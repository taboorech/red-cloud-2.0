import { z as zod } from "zod";
import { paginationValidation, userIdValidation } from "./main.scheme";
import { ASSIGNABLE_USER_ROLES, UserAccess } from "../enum/user.enum";

const getAllUsersValidation = zod.object({}).extend(paginationValidation.shape);

const updateUserRoleValidation = zod
  .object({
    role: zod.enum(
      ASSIGNABLE_USER_ROLES,
      `User role must be one of ${ASSIGNABLE_USER_ROLES.join(", ")}`,
    ),
  })
  .extend(userIdValidation.shape);

const changeUserAccessValidation = zod
  .object({
    action: zod.enum(
      UserAccess,
      `Action must be one of ${Object.values(UserAccess).join(", ")}`,
    ),
  })
  .extend(userIdValidation.shape);

const setUserSubscriptionValidation = zod
  .object({
    planId: zod.coerce.number().int().positive(),
    expiresAt: zod
      .string()
      .refine((s) => !Number.isNaN(Date.parse(s)), {
        message: "expiresAt must be a valid date",
      })
      .nullable()
      .optional(),
  })
  .extend(userIdValidation.shape);

const giftSubscriptionValidation = zod
  .object({
    planId: zod.coerce.number().int().positive().optional(),
    days: zod.coerce
      .number()
      .int("days must be an integer")
      .positive("days must be positive")
      .max(3650, "days cannot exceed 3650 (10 years)")
      .nullable(),
  })
  .extend(userIdValidation.shape);

export {
  getAllUsersValidation,
  updateUserRoleValidation,
  changeUserAccessValidation,
  setUserSubscriptionValidation,
  giftSubscriptionValidation,
};
