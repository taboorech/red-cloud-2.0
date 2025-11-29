import { logger } from "@app/lib/logger";
import { SongState } from "@app/lib/types/song";
import { RedisKeyGroup, RedisUtils } from "@app/lib/utils/redis";
import { validateSongState } from "@app/lib/utils/song";
import { Socket } from "socket.io";

const SONG_STATE_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

const generateCurrentSongStateRedisKey = (userId: number) =>
  `user:${userId}:current_song_state`;

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

export async function songStateSocketOnConnection(socket: Socket) {
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

    socket.emit("song-state:connected", lastState);
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
    } catch (err) {
      logger().error("[SOCKET][SONG STATE][update] Error:", err);
      socket.emit("song-state:error", "Failed to update song state");
    }
  });

  socket.on("song-state:clear", async () => {
    try {
      await clearSongState(userId);
      socket.emit("song-state:cleared");
      logger().info(`[SOCKET][SONG STATE] User ${userId} cleared state`);
    } catch (err) {
      logger().error("[SOCKET][SONG STATE][clear] Error:", err);
      socket.emit("song-state:error", "Failed to clear song state");
    }
  });
}

export function songStateSocketOnDisconnect(socket: Socket) {
  socket.removeAllListeners("song-state:update");
  socket.removeAllListeners("song-state:clear");
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
