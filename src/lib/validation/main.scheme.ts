import { z as zod } from "zod";
import { browserHeader } from "../constants/app";

const idValidation = zod.object({
  id: zod.coerce.number("Id can't be empty"),
});

const userIdValidation = zod.object({
  userId: zod.coerce.number("User id can't be empty"),
});

const paginationValidation = zod.object({
  offset: zod.coerce
    .number()
    .min(0, { message: '"offset" must be greater than or equal to 0' })
    .optional(),

  limit: zod.coerce
    .number()
    .min(1, { message: '"limit" must be at least 1' })
    .max(100, { message: '"limit" cannot be greater than 100' })
    .optional(),

  search: zod.string().optional(),

  ids: zod.preprocess((val) => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val;
    if (typeof val === "string") return val.split(",");
    return val;
  }, zod.array(zod.coerce.number().int().nonnegative()).optional()),
});

const authorizationValidation = zod.object({
  authorization: zod.string().regex(/^Bearer\s.+$/, {
    message: "Authorization header must contain Bearer token",
  }),
});

const browserHeaderValidation = zod.object({
  [browserHeader]: zod
    .string()
    .min(1, `Browser header (${browserHeader}) is required`),
});

export {
  idValidation,
  userIdValidation,
  paginationValidation,
  authorizationValidation,
  browserHeaderValidation,
};
