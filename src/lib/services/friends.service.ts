import { injectable, inject } from "inversify";
import {
  acceptFriendRequestSchema,
  addFriendSchema,
  getAllFriendsSchema,
  removeFriendSchema,
} from "../validation/friends.scheme";
import z from "zod";
import { FriendModel, FriendStatus } from "../db/models/friends.model";
import { NotificationService } from "./notification.service";
import { UserModel } from "../db/models/user.model";
import { NotificationTypeModel } from "../db/models/notification-types.model";

@injectable()
export class FriendsService {
  constructor(
    @inject(NotificationService)
    private notificationService: NotificationService,
  ) {}

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
              .whereILike("name", `%${search}%`)
              .orWhereILike("email", `%${search}%`),
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

    const notificationType = await NotificationTypeModel.query()
      .where("code", "friend_request")
      .first();

    const sender = await UserModel.query().where("id", userId).first();

    if (notificationType && sender) {
      await this.notificationService.createNotification({
        typeId: notificationType.id,
        recipientId: friendId,
        senderId: userId,
        relatedEntityType: "friend_request",
        relatedEntityId: null,
        title: "New Friend Request",
        message: `${sender.username} sent you a friend request`,
      });
    }
  }

  public async acceptFriendRequest({
    requestId,
    userId,
  }: z.infer<typeof acceptFriendRequestSchema>) {
    await FriendModel.transaction(async (trx) => {
      const request = await FriendModel.query(trx)
        .where("id", requestId)
        .andWhere("friend_id", userId)
        .first();

      if (!request) {
        throw new Error("Friend request not found");
      }

      await FriendModel.query(trx).insert({
        user_id: request.friend_id,
        friend_id: request.user_id,
        status: FriendStatus.accepted,
      });

      await FriendModel.query(trx)
        .where("id", requestId)
        .andWhere("friend_id", userId)
        .update({
          status: FriendStatus.accepted,
        });
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
