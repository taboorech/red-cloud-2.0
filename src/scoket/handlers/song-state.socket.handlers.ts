import { logger } from "@app/lib/logger";
import { SongState } from "@app/lib/types/song";
import { RedisKeyGroup, RedisUtils } from "@app/lib/utils/redis";
import { Socket } from "socket.io";

const generateCurrentSongStateRedisKey = (userId: number) =>
  `user:${userId}:current_song_state`;

export async function songStateSocketOnConnection(socket: Socket) {
  const lastState = await RedisUtils.getRedisKey({
    group: RedisKeyGroup.APP,
    key: generateCurrentSongStateRedisKey(socket.handshake.auth.user.id),
  });

  socket.emit("song-state:connected", lastState);

  socket.on("song-state:update", async (data: SongState) => {
    try {
      await songUpdateHandler(socket, data);
    } catch (err) {
      logger().error("[SOCKET][SONG STATE][update] Error:", err);
      socket.emit("song-state:error", "Failed to update song state");
    }
  });
}

export function songStateSocketOnDisconnect(socket: Socket) {
  socket.removeAllListeners("song-state:pause");
}

async function songUpdateHandler(socket: Socket, data: SongState) {
  await RedisUtils.setRedisKey({
    group: RedisKeyGroup.APP,
    key: generateCurrentSongStateRedisKey(socket.handshake.auth.user.id),
    value: JSON.stringify({ ...data, isPlaying: false }),
  });
  logger().info(`[SOCKET][SONG STATE][${data.id}] Song paused`);
}
