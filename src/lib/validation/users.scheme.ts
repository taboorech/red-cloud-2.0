import { z as zod } from "zod";
import { paginationValidation, userIdValidation } from "./main.scheme";
import { UserAccess, UserRole } from "../enum/user.enum";

const getAllUsersValidation = zod.object({}).extend(paginationValidation.shape);

const updateUserRoleValidation = zod
  .object({
    role: zod.enum(
      UserRole,
      `User role must be one of ${Object.values(UserRole).join(", ")}`,
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
