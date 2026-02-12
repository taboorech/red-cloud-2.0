import { z as zod } from "zod";
import { paginationValidation, userIdValidation } from "./main.scheme";

const friendIdValidation = zod.object({
  friendId: zod.coerce.number("Friend id can't be empty"),
});

const getAllFriendsSchema = userIdValidation.extend(paginationValidation.shape);

const addFriendSchema = userIdValidation.extend(friendIdValidation.shape);

const acceptFriendRequestSchema = zod
  .object({
    requestId: zod.coerce.number("Request id can't be empty"),
  })
  .extend(userIdValidation.shape);

const removeFriendSchema = userIdValidation.extend(friendIdValidation.shape);

export {
  getAllFriendsSchema,
  addFriendSchema,
  acceptFriendRequestSchema,
  removeFriendSchema,
};
