import { z as zod } from "zod";

import {
  authorizationValidation,
  browserHeaderValidation,
  userIdValidation,
} from "./main.scheme";

const getAuthUrlValidation = zod
  .object({})
  .extend(browserHeaderValidation.shape);

const exchangeCodeValidation = zod.object({
  code: zod.string().min(1, { message: "Code is required" }),
  state: zod.string().min(1, { message: "State is required" }),
});

const passwordValidation = zod.object({
  password: zod
    .string()
    // ! DEV ONLY
    // .min(8, "Password must contain at least 8 symbols")
    .max(128, "Password can contain less than 128 symbols"),
});

const signUpValidation = zod
  .object({
    email: zod.email("Wrong email"),
    username: zod
      .string()
      .min(3, "3 symbols at least")
      .max(32, "32 symbols maximum")
      .regex(/^[\p{L}\p{N}_.-]+$/u, "Letters, numbers, _, ., -"),
  })
  .extend(browserHeaderValidation.shape)
  .extend(passwordValidation.shape);

const loginValidation = zod
  .object({
    email: zod.email("Wrong email"),
  })
  .extend(passwordValidation.shape)
  .extend(browserHeaderValidation.shape);

const refreshTokensValidation = zod
  .object({})
  .extend(userIdValidation.shape)
  .extend(authorizationValidation.shape)
  .extend(browserHeaderValidation.shape);

const logoutValidation = zod
  .object({})
  .extend(userIdValidation.shape)
  .extend(browserHeaderValidation.shape);

export {
  getAuthUrlValidation,
  exchangeCodeValidation,
  signUpValidation,
  loginValidation,
  refreshTokensValidation,
  logoutValidation,
  passwordValidation,
};
