import { logger } from "@app/lib/logger";
import { SongState } from "@app/lib/types/song";
import { RedisKeyGroup, RedisUtils } from "@app/lib/utils/redis";
import { validateSongState } from "@app/lib/utils/song";
import { Socket, Server } from "socket.io";
import { SongService } from "@app/lib/services/song.service";
import { Container } from "inversify";
import { FriendModel, FriendStatus } from "@app/lib/db/models/friends.model";
import { PrivacyService } from "@app/lib/services/privacy.service";

const SONG_STATE_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

const generateCurrentSongStateRedisKey = (userId: number) =>
  `user:${userId}:current_song_state`;

async function getUserFriendIds(userId: number): Promise<number[]> {
  const rows = await FriendModel.query()
    .where("user_id", userId)
    .where("status", FriendStatus.accepted)
    .select("friend_id");
  return rows.map((r) => r.friend_id);
}

function parseSongState(stateString: string | null): SongState | null {
  if (!stateString) return null;

  try {
    const parsed = JSON.parse(stateString);
    return validateSongState(parsed) ? parsed : null;
  } catch (err) {
    logger().error("[SOCKET][SONG STATE] Failed to parse state:", err);
    return null;
  }
}

export async function songStateSocketOnConnection(
  socket: Socket,
  io: Server,
  ioc: Container,
) {
  const userId = socket.handshake.auth?.user?.id;

  if (!userId) {
    logger().error("[SOCKET][SONG STATE] Missing user ID on connection");
    socket.emit("song-state:error", "Unauthorized");
    return;
  }

  try {
    const stateString = await RedisUtils.getRedisKey({
      group: RedisKeyGroup.APP,
      key: generateCurrentSongStateRedisKey(userId),
    });

    const lastState = parseSongState(stateString);

    const song = await ioc.get(SongService).getSong({
      userId: userId,
      songId: lastState ? parseInt(lastState.id) : 0,
      withGenres: true,
    });

    socket.emit("song-state:connected", {
      ...lastState,
      song,
    });
    logger().info(
      `[SOCKET][SONG STATE] User ${userId} connected, state: ${lastState ? "found" : "empty"}`,
    );
  } catch (err) {
    logger().error("[SOCKET][SONG STATE] Connection error:", err);
    socket.emit("song-state:connected", null);
  }

  socket.on("song-state:update", async (data: SongState) => {
    try {
      await songUpdateHandler(socket, userId, data);
      await handleListening(ioc, userId, {
        songId: parseInt(data.id),
        durationListened: data.currentTime,
        totalDuration: data.duration,
      });
      await broadcastSongStateToFriends(io, ioc, userId, data);
    } catch (err) {
      logger().error("[SOCKET][SONG STATE][update] Error:", err);
      socket.emit("song-state:error", "Failed to update song state");
    }
  });

  socket.on("song-state:clear", async () => {
    try {
      await clearSongState(userId);
      await broadcastFriendStopped(io, ioc, userId);
      socket.emit("song-state:cleared");
      logger().info(`[SOCKET][SONG STATE] User ${userId} cleared state`);
    } catch (err) {
      logger().error("[SOCKET][SONG STATE][clear] Error:", err);
      socket.emit("song-state:error", "Failed to clear song state");
    }
  });

  socket.on("get-friends-listening", async () => {
    try {
      const friendIds = await getUserFriendIds(userId);
      const songService = ioc.get(SongService);
      const privacyService = ioc.get(PrivacyService);
      const result: Array<{
        userId: number;
        song: any;
        currentTime: number;
        duration: number;
        isPlaying: boolean;
        updatedAt: number;
      }> = [];

      for (const friendId of friendIds) {
        const allowed = await privacyService.canViewListening(userId, friendId);
        if (!allowed) continue;
        const stateString = await RedisUtils.getRedisKey({
          group: RedisKeyGroup.APP,
          key: generateCurrentSongStateRedisKey(friendId),
        });
        const state = parseSongState(stateString);
        if (!state || !state.id) continue;

        const song = await songService.getSong({
          userId: friendId,
          songId: parseInt(state.id),
        });
        if (!song) continue;

        result.push({
          userId: friendId,
          song,
          currentTime: state.currentTime,
          duration: state.duration,
          isPlaying: state.isPlaying,
          updatedAt: state.updatedAt ?? 0,
        });
      }

      socket.emit("friends-listening-list", { friends: result });
    } catch (err) {
      logger().error("[SOCKET][SONG STATE][friends-listening] Error:", err);
      socket.emit("friends-listening-list", { friends: [] });
    }
  });
}

async function broadcastSongStateToFriends(
  io: Server,
  ioc: Container,
  userId: number,
  data: SongState,
) {
  const friendIds = await getUserFriendIds(userId);
  if (friendIds.length === 0) return;

  const recipients = await ioc
    .get(PrivacyService)
    .filterListeningRecipients(userId, friendIds);
  if (recipients.length === 0) return;

  const songService = ioc.get(SongService);
  const song = await songService.getSong({
    userId,
    songId: parseInt(data.id),
  });
  if (!song) return;

  const payload = {
    userId,
    song,
    currentTime: data.currentTime,
    duration: data.duration,
    isPlaying: data.isPlaying,
    updatedAt: Date.now(),
  };

  for (const friendId of recipients) {
    io.to(`user:${friendId}`).emit("friend-song-state", payload);
  }
}

async function broadcastFriendStopped(
  io: Server,
  ioc: Container,
  userId: number,
) {
  const friendIds = await getUserFriendIds(userId);
  const recipients = await ioc
    .get(PrivacyService)
    .filterListeningRecipients(userId, friendIds);
  for (const friendId of recipients) {
    io.to(`user:${friendId}`).emit("friend-song-stopped", { userId });
  }
}

export async function songStateSocketOnDisconnect(
  socket: Socket,
  io: Server,
  ioc: Container,
) {
  socket.removeAllListeners("song-state:update");
  socket.removeAllListeners("song-state:clear");
  socket.removeAllListeners("get-friends-listening");

  const userId = socket.handshake.auth?.user?.id;
  if (!userId) return;
  try {
    await broadcastFriendStopped(io, ioc, userId);
  } catch (err) {
    logger().error("[SOCKET][SONG STATE][disconnect] Error:", err);
  }
}

async function songUpdateHandler(
  socket: Socket,
  userId: number,
  data: SongState,
) {
  if (!validateSongState(data)) {
    logger().error("[SOCKET][SONG STATE] Invalid song state data:", data);
    socket.emit("song-state:error", "Invalid song state data");
    return;
  }

  const stateToSave = {
    ...data,
    updatedAt: Date.now(),
  };

  await RedisUtils.setRedisKey({
    group: RedisKeyGroup.APP,
    key: generateCurrentSongStateRedisKey(userId),
    value: JSON.stringify(stateToSave),
    ttl: SONG_STATE_TTL,
  });

  logger().info(
    `[SOCKET][SONG STATE][${data.id}] User ${userId} - ${data.isPlaying ? "playing" : "paused"} at ${data.currentTime.toFixed(1)}s`,
  );
}

async function clearSongState(userId: number) {
  await RedisUtils.removeRedisKey({
    group: RedisKeyGroup.APP,
    key: generateCurrentSongStateRedisKey(userId),
  });
}

async function handleListening(
  ioc: Container,
  userId: number,
  data: {
    songId: number;
    durationListened: number;
    totalDuration: number;
  },
) {
  if (
    !data.songId ||
    // !data.durationListened ||
    !data.totalDuration ||
    data.durationListened < 0 ||
    data.durationListened > data.totalDuration
  ) {
    logger().error("[SOCKET][SONG STATE] Invalid listening data:", data);
    return;
  }

  const songService = ioc.get(SongService);
  const listening = await songService.recordListening({
    userId,
    songId: data.songId,
    durationListened: data.durationListened,
    totalDuration: data.totalDuration,
  });

  if (listening) {
    logger().info(
      `[SOCKET][SONG STATE] User ${userId} listened to song ${data.songId} - ${Math.round((data.durationListened / data.totalDuration) * 100)}%`,
    );
  }
}
