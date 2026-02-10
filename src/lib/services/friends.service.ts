import { injectable } from "inversify";
import {
  acceptFriendRequestSchema,
  addFriendSchema,
  getAllFriendsSchema,
  removeFriendSchema,
} from "../validation/friends.scheme";
import z from "zod";
import { FriendModel, FriendStatus } from "../db/models/friends.model";

@injectable()
export class FriendsService {
  constructor() {}

  public async getFriends({
    limit,
    offset,
    search,
    ids,
    userId,
  }: z.infer<typeof getAllFriendsSchema>) {
    const friends = await FriendModel.query()
      .where("user_id", userId)
      .where("status", FriendStatus.accepted)
      .withGraphFetched("friend")
      .modify((builder) => {
        if (ids?.length) {
          builder.whereIn("friend_id", ids);
        }

        if (search) {
          builder.whereExists(
            FriendModel.relatedQuery("friend")
              .where("name", "ilike", `%${search}%`)
              .orWhere("email", "ilike", `%${search}%`),
          );
        }

        if (offset) {
          builder.offset(offset);
        }

        if (limit) {
          builder.limit(limit);
        }
      })
      .orderBy("id", "desc");

    return friends;
  }

  public async addFriend({
    friendId,
    userId,
  }: z.infer<typeof addFriendSchema>) {
    await FriendModel.query().insert({
      user_id: userId,
      friend_id: friendId,
      status: FriendStatus.pending,
    });
  }

  public async acceptFriendRequest({
    requestId,
    userId,
  }: z.infer<typeof acceptFriendRequestSchema>) {
    await FriendModel.query()
      .where("id", requestId)
      .andWhere("friend_id", userId)
      .update({
        status: FriendStatus.accepted,
      });
  }

  public async removeFriend({
    friendId,
    userId,
  }: z.infer<typeof removeFriendSchema>) {
    await FriendModel.query()
      .where("user_id", userId)
      .andWhere("friend_id", friendId)
      .delete();
  }
}
