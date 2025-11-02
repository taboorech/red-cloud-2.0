import { logger } from "@app/lib/logger";
import { SongState } from "@app/lib/types/song";
import { RedisKeyGroup, RedisUtils } from "@app/lib/utils/redis";
import { Socket } from "socket.io";

const generateCurrentSongStateRedisKey = (roomId: number) =>
  `room:${roomId}:current_song_state`;

async function roomSongUpdateHandler(data: SongState) {
  await RedisUtils.setRedisKey({
    group: RedisKeyGroup.APP,
    key: generateCurrentSongStateRedisKey(data.roomOptions!.roomId),
    value: JSON.stringify(data),
  });
  logger().info(`[SOCKET][SONG STATE][${data.id}] Song paused`);
}

export function groupRoomSocketHandlers(socket: Socket) {
  const user = socket.handshake.auth?.user;
  if (!user) {
    socket.emit("room:error", "Unauthorized: missing user context");
    return;
  }

  socket.on("room:join", async (room: number) => {
    // TODO: Set restriction on number of users in room (upgrade to premium to have more users/rooms)
    socket.join(room.toString());
    socket.emit("room:join:message:self", `You joined room: ${room}`);

    try {
      let songState: SongState | null = null;
      const res = await RedisUtils.getRedisKey({
        group: RedisKeyGroup.APP,
        key: generateCurrentSongStateRedisKey(room),
      });

      if (!res) {
        // TODO: Create record into DB
        logger().info(`[SOCKET][ROOM][${room}] Created new room`);
      } else {
        songState = JSON.parse(res);
        socket.emit("room:song:update", songState);
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

  socket.on("room:close", (room: string) => {
    socket.to(room).emit("room:close", "The room has been closed by the host.");

    const io = socket.nsp.server;
    const clients = io.sockets.adapter.rooms.get(room);

    if (clients) {
      for (const clientId of clients) {
        const clientSocket = io.sockets.sockets.get(clientId);
        clientSocket?.leave(room);
      }
    }

    // TODO: Remove room data from DB/Redis
  });
}
