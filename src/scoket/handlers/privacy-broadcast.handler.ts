import { Server } from "socket.io";
import { Container } from "inversify";
import { redis } from "@app/lib/db/redis.client";
import {
  PRIVACY_EVENTS_CHANNEL,
  PrivacyChangedEvent,
} from "@app/lib/utils/privacy-broadcaster";
import { PrivacyService } from "@app/lib/services/privacy.service";
import { SongService } from "@app/lib/services/song.service";
import { FriendModel, FriendStatus } from "@app/lib/db/models/friends.model";
import { RedisKeyGroup, RedisUtils } from "@app/lib/utils/redis";
import { SongState } from "@app/lib/types/song";
import { validateSongState } from "@app/lib/utils/song";
import { logger } from "@app/lib/logger";

export async function attachPrivacyBroadcastHandler(
  io: Server,
  ioc: Container,
): Promise<void> {
  const subscriber = redis().duplicate();
  await subscriber.subscribe(PRIVACY_EVENTS_CHANNEL);

  subscriber.on("message", async (_channel, message) => {
    try {
      const event = JSON.parse(message) as PrivacyChangedEvent;
      if (event.type !== "privacy-changed") return;
      logger().info(
        `[PRIVACY BROADCAST] Received privacy-change for user=${event.userId}`,
      );
      await rebroadcastForUser(io, ioc, event.userId);
    } catch (err) {
      logger().error("[PRIVACY BROADCAST] Failed to handle event:", err);
    }
  });

  logger().info("[PRIVACY BROADCAST] Subscribed to privacy-events channel");
}

async function rebroadcastForUser(
  io: Server,
  ioc: Container,
  userId: number,
): Promise<void> {
  const privacyService = ioc.get(PrivacyService);
  const songService = ioc.get(SongService);

  const friends = await FriendModel.query()
    .where("user_id", userId)
    .where("status", FriendStatus.accepted);
  if (friends.length === 0) return;

  const userRoom = io.sockets.adapter.rooms.get(`user:${userId}`);
  const isOnline = !!userRoom && userRoom.size > 0;

  const songStateStr = await RedisUtils.getRedisKey({
    group: RedisKeyGroup.APP,
    key: `user:${userId}:current_song_state`,
  });
  let songState: SongState | null = null;
  if (songStateStr) {
    try {
      const parsed = JSON.parse(songStateStr);
      if (validateSongState(parsed)) songState = parsed;
    } catch {
      // ignore
    }
  }

  let song: unknown = null;
  if (isOnline && songState && songState.id) {
    song = await songService.getSong({
      userId,
      songId: parseInt(songState.id),
    });
  }

  logger().info(
    `[PRIVACY BROADCAST] user=${userId} isOnline=${isOnline} hasSong=${!!song} friends=${friends.length}`,
  );

  for (const friend of friends) {
    const friendId = friend.friend_id;

    const canSeePresence = await privacyService.canViewPresence(
      friendId,
      userId,
    );
    const presenceEvent =
      isOnline && canSeePresence ? "friend-online" : "friend-offline";
    io.to(`user:${friendId}`).emit(presenceEvent, {
      userId,
      status: presenceEvent === "friend-online" ? "online" : "offline",
      timestamp: new Date().toISOString(),
    });

    const canSeeListening = await privacyService.canViewListening(
      friendId,
      userId,
    );
    if (isOnline && canSeeListening && song && songState) {
      io.to(`user:${friendId}`).emit("friend-song-state", {
        userId,
        song,
        currentTime: songState.currentTime,
        duration: songState.duration,
        isPlaying: songState.isPlaying,
        updatedAt: songState.updatedAt ?? Date.now(),
      });
    } else {
      io.to(`user:${friendId}`).emit("friend-song-stopped", { userId });
    }

    logger().info(
      `[PRIVACY BROADCAST]   → friend=${friendId} presence=${presenceEvent} listening=${
        isOnline && canSeeListening && song ? "friend-song-state" : "friend-song-stopped"
      }`,
    );
  }
}
