import { z as zod } from "zod";
import { userIdValidation, usernameSchema } from "./main.scheme";
import { passwordValidation } from "./auth.scheme";

const getProfileValidation = zod
  .object({
    withSubscription: zod.boolean().optional().default(true),
    withSongs: zod.boolean().optional().default(true),
  })
  .extend(userIdValidation.shape);

const updateProfileSchema = zod
  .object({
    country: zod.string().optional(),
  })
  .extend(usernameSchema.partial().shape)
  .extend(userIdValidation.shape);

const changeUserPasswordValidation = zod
  .object({
    currentPassword: zod.string().optional(),
  })
  .extend(userIdValidation.shape)
  .extend(passwordValidation.shape);

export {
  getProfileValidation,
  updateProfileSchema,
  changeUserPasswordValidation,
};
