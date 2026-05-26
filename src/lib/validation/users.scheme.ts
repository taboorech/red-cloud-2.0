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

export {
  getAllUsersValidation,
  updateUserRoleValidation,
  changeUserAccessValidation,
};
