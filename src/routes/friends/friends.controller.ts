import { FriendsService } from "@app/lib/services/friends.service";
import {
  acceptFriendRequestSchema,
  addFriendSchema,
  getAllFriendsSchema,
  removeFriendSchema,
} from "@app/lib/validation/friends.scheme";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class FriendsController {
  constructor(@inject(FriendsService) private friendsService: FriendsService) {
    this.getFriends = this.getFriends.bind(this);
    this.addFriend = this.addFriend.bind(this);
    this.acceptFriendRequest = this.acceptFriendRequest.bind(this);
    this.removeFriend = this.removeFriend.bind(this);
  }

  public async getFriends(req: Request, res: Response) {
    const parse = getAllFriendsSchema.parse({
      ...req.query,
      userId: req.user?.id,
    });

    const friends = await this.friendsService.getFriends(parse);

    res.json({
      status: "OK",
      data: friends,
    });
  }

  public async addFriend(req: Request, res: Response) {
    const parse = addFriendSchema.parse({
      ...req.params,
      userId: req.user?.id,
    });

    await this.friendsService.addFriend(parse);

    res.json({
      status: "OK",
    });
  }

  public async acceptFriendRequest(req: Request, res: Response) {
    const parse = acceptFriendRequestSchema.parse({
      ...req.params,
      userId: req.user?.id,
    });

    await this.friendsService.acceptFriendRequest(parse);

    res.json({
      status: "OK",
    });
  }

  public async removeFriend(req: Request, res: Response) {
    const parse = removeFriendSchema.parse({
      ...req.params,
      userId: req.user?.id,
    });

    await this.friendsService.removeFriend(parse);

    res.json({
      status: "OK",
    });
  }
}
