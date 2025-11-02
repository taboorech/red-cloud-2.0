import { z as zod } from "zod";
import { userIdValidation } from "./main.scheme";
import { passwordValidation } from "./auth.scheme";

const getProfileValidation = zod.object({}).extend(userIdValidation.shape);
const changeUserPasswordValidation = zod
  .object({
    currentPassword: zod.string().optional(),
  })
  .extend(userIdValidation.shape)
  .extend(passwordValidation.shape);

export { getProfileValidation, changeUserPasswordValidation };
