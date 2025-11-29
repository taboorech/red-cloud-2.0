import { logger } from "@app/lib/logger";
import { SongState } from "@app/lib/types/song";
import { RedisKeyGroup, RedisUtils } from "@app/lib/utils/redis";
import { validateSongState } from "@app/lib/utils/song";
import { Socket } from "socket.io";

const ROOM_SONG_STATE_TTL = 60 * 60 * 24; // 24 hours in seconds

const generateCurrentSongStateRedisKey = (roomId: number) =>
  `room:${roomId}:current_song_state`;

function parseSongState(stateString: string | null): SongState | null {
  if (!stateString) return null;

  try {
    const parsed = JSON.parse(stateString);
    return validateSongState(parsed) ? parsed : null;
  } catch (err) {
    logger().error("[SOCKET][ROOM] Failed to parse song state:", err);
    return null;
  }
}

async function roomSongUpdateHandler(data: SongState) {
  if (!validateSongState(data)) {
    logger().error("[SOCKET][ROOM] Invalid song state data:", data);
    throw new Error("Invalid song state data");
  }

  const stateToSave = {
    ...data,
    updatedAt: Date.now(),
  };

  await RedisUtils.setRedisKey({
    group: RedisKeyGroup.APP,
    key: generateCurrentSongStateRedisKey(data.roomOptions!.roomId),
    value: JSON.stringify(stateToSave),
    ttl: ROOM_SONG_STATE_TTL,
  });

  logger().info(
    `[SOCKET][ROOM][${data.roomOptions!.roomId}] Song ${data.id} - ${data.isPlaying ? "playing" : "paused"} at ${data.currentTime.toFixed(1)}s`,
  );
}

export function groupRoomSocketHandlers(socket: Socket) {
  const user = socket.handshake.auth?.user;
  if (!user) {
    socket.emit("room:error", "Unauthorized: missing user context");
    return;
  }

  socket.on("room:join", async (roomId: string) => {
    // TODO: Set restriction on number of users in room (upgrade to premium to have more users/rooms)

    const room = Number(roomId);
    if (!room || typeof room !== "number") {
      socket.emit("room:error", "Invalid room ID");
      return;
    }

    try {
      socket.join(room.toString());
      socket.emit("room:join:message:self", `You joined room: ${room}`);

      const stateString = await RedisUtils.getRedisKey({
        group: RedisKeyGroup.APP,
        key: generateCurrentSongStateRedisKey(room),
      });

      const songState = parseSongState(stateString);

      if (songState) {
        socket.emit("room:song:update", songState);
        logger().info(
          `[SOCKET][ROOM][${room}] User ${user.username} joined, state restored`,
        );
      } else {
        // TODO: Create record into DB
        logger().info(
          `[SOCKET][ROOM][${room}] User ${user.username} joined, new room`,
        );
      }

      socket
        .to(room.toString())
        .emit(
          "room:join:message:someone",
          `${socket.handshake.auth.user.username} joined`,
        );
    } catch (err) {
      logger().error("[SOCKET][ROOM] Error:", err);
      socket.emit("room:error", "Failed to join the room");
    }
  });

  socket.on("room:song:update", async (data: SongState) => {
    if (!data.roomOptions?.roomId) {
      logger().error(
        "[SOCKET][ROOM][SONG UPDATE] Missing room ID in song state data",
      );
      return;
    }

    socket
      .to(data.roomOptions.roomId.toString())
      .emit("room:song:update", data);
    try {
      await roomSongUpdateHandler(data);
    } catch (err) {
      logger().error("[SOCKET][ROOM][SONG UPDATE] Error:", err);
    }
  });

  socket.on("room:leave", (room: string) => {
    socket.leave(room);
    socket.emit("room:leave:message:self", `You left room: ${room}`);
    socket.to(room).emit("room:leave:message:someone", `${socket.id} left`);

    // TODO: If no ones in room remove from DB/redis
  });

  socket.on("room:close", async (room: string) => {
    socket.to(room).emit("room:close", "The room has been closed by the host.");

    const io = socket.nsp.server;
    const clients = io.sockets.adapter.rooms.get(room);

    if (clients) {
      for (const clientId of clients) {
        const clientSocket = io.sockets.sockets.get(clientId);
        clientSocket?.leave(room);
      }
    }

    // Remove room song state from Redis
    try {
      const roomId = parseInt(room, 10);
      if (!isNaN(roomId)) {
        await RedisUtils.removeRedisKey({
          group: RedisKeyGroup.APP,
          key: generateCurrentSongStateRedisKey(roomId),
        });
        logger().info(
          `[SOCKET][ROOM][${roomId}] Room closed and state cleared`,
        );
      }
    } catch (err) {
      logger().error("[SOCKET][ROOM] Error clearing room state:", err);
    }
    // TODO: Remove room data from DB
  });
}
