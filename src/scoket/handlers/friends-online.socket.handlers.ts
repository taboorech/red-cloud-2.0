import { Socket, Server } from "socket.io";
import { Container } from "inversify";
import { logger } from "@app/lib/logger";
import { FriendModel, FriendStatus } from "@app/lib/db/models/friends.model";
import { PrivacyService } from "@app/lib/services/privacy.service";

export async function friendsOnlineSocketOnConnection(
  socket: Socket,
  io: Server,
  ioc: Container,
) {
  const userId = socket.handshake.auth?.user?.id;

  if (!userId) {
    logger().error("[SOCKET][FRIENDS ONLINE] Missing user ID on connection");
    return;
  }

  try {
    // Join user to their own room for receiving friend status updates
    socket.join(`user:${userId}`);

    // Get user's friends list
    const userFriends = await FriendModel.query()
      .where("user_id", userId)
      .where("status", FriendStatus.accepted);

    const recipients = await ioc.get(PrivacyService).filterPresenceRecipients(
      userId,
      userFriends.map((f) => f.friend_id),
    );

    // Notify all friends that this user is online
    for (const friendId of recipients) {
      io.to(`user:${friendId}`).emit("friend-online", {
        userId: userId,
        status: "online",
        timestamp: new Date().toISOString(),
      });
    }

    logger().info(
      `[SOCKET][FRIENDS ONLINE] User ${userId} connected, notified ${recipients.length}/${userFriends.length} friends`,
    );
  } catch (err) {
    logger().error("[SOCKET][FRIENDS ONLINE] Connection error:", err);
  }

  // Handle request for friends online status
  socket.on("get-friends-online", async () => {
    try {
      const userFriends = await FriendModel.query()
        .where("user_id", userId)
        .where("status", FriendStatus.accepted)
        .withGraphFetched("friend");

      const privacyService = ioc.get(PrivacyService);
      const onlineFriends = [];

      for (const friend of userFriends) {
        const friendRoom = io.sockets.adapter.rooms.get(
          `user:${friend.friend_id}`,
        );
        const isOnline = friendRoom && friendRoom.size > 0;
        if (!isOnline) continue;

        const visible = await privacyService.canViewPresence(
          userId,
          friend.friend_id,
        );
        if (!visible) continue;

        onlineFriends.push({
          id: friend.friend_id,
          username: friend.friend?.username,
          avatar: friend.friend?.avatar,
          isOnline: true,
          lastSeen: new Date().toISOString(),
        });
      }

      socket.emit("friends-online-list", {
        friends: onlineFriends,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger().error("[SOCKET][FRIENDS ONLINE] Get online friends error:", err);
    }
  });
}

export async function friendsOnlineSocketOnDisconnect(
  socket: Socket,
  io: Server,
  ioc: Container,
) {
  const userId = socket.handshake.auth?.user?.id;

  if (!userId) {
    return;
  }

  try {
    // Get user's friends list
    const userFriends = await FriendModel.query()
      .where("user_id", userId)
      .where("status", FriendStatus.accepted);

    const recipients = await ioc.get(PrivacyService).filterPresenceRecipients(
      userId,
      userFriends.map((f) => f.friend_id),
    );

    // Notify all friends that this user is offline
    for (const friendId of recipients) {
      io.to(`user:${friendId}`).emit("friend-offline", {
        userId: userId,
        status: "offline",
        timestamp: new Date().toISOString(),
      });
    }

    logger().info(
      `[SOCKET][FRIENDS ONLINE] User ${userId} disconnected, notified ${recipients.length}/${userFriends.length} friends`,
    );
  } catch (err) {
    logger().error("[SOCKET][FRIENDS ONLINE] Disconnect error:", err);
  }
}
