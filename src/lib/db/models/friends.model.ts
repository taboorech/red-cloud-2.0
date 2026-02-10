import Model from "../knex-objection";
import { UserModel } from "./user.model";

export enum FriendStatus {
  pending = "pending",
  accepted = "accepted",
  rejected = "rejected",
}

export interface IFriend {
  id: number;
  user_id: number;
  friend_id: number;
  status: FriendStatus;
}

export class FriendModel extends Model implements IFriend {
  static tableName = "friends";

  id!: number;
  user_id!: number;
  friend_id!: number;
  status!: FriendStatus;

  static relationMappings = {
    friend: {
      relation: Model.HasOneRelation,
      modelClass: UserModel,
      join: {
        from: "friends.friend_id",
        to: "users.id",
      },
    },
  };
}
