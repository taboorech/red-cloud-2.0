export enum UserRole {
  USER = "user",
  OPERATOR = "operator",
  ADMIN = "admin",
  OWNER = "owner",
}

export const ASSIGNABLE_USER_ROLES = [
  UserRole.USER,
  UserRole.OPERATOR,
  UserRole.ADMIN,
] as const;

export enum UserAccess {
  BAN = "ban",
  PARDON = "pardon",
}
