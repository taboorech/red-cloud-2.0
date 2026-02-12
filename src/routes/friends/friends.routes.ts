import { Router } from "express";
import { Container } from "inversify";
import { FriendsController } from "./friends.controller";

export function createFriendsRoutes(ioc: Container): Router {
  const router = Router();

  const ctrl = ioc.get(FriendsController);

  router.get("/", ctrl.getFriends);
  router.post("/:friendId", ctrl.addFriend);
  router.put("/:requestId", ctrl.acceptFriendRequest);
  router.delete("/:friendId", ctrl.removeFriend);

  return router;
}
