import { z as zod } from "zod";
import { VISIBILITY_VALUES } from "../db/models/user-privacy-settings.model";
import { EXCLUSION_SCOPE_VALUES } from "../db/models/user-privacy-exclusion.model";

const updatePrivacyValidation = zod
  .object({
    listening_visibility: zod.enum(VISIBILITY_VALUES).optional(),
    presence_visibility: zod.enum(VISIBILITY_VALUES).optional(),
  })
  .refine(
    (data) =>
      data.listening_visibility !== undefined ||
      data.presence_visibility !== undefined,
    { message: "Provide at least one field to update" },
  );

const exclusionParamsValidation = zod.object({
  friendId: zod.coerce.number().int().positive(),
  scope: zod.enum(EXCLUSION_SCOPE_VALUES),
});

export { updatePrivacyValidation, exclusionParamsValidation };
