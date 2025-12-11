import http from "http";
import { Server } from "socket.io";
import {
  songStateSocketOnConnection,
  songStateSocketOnDisconnect,
} from "./handlers/song-state.socket.handlers";
import { socketAuthMiddleware } from "@app/lib/utils/middlewares/auth.middleware";
import { groupRoomSocketHandlers } from "./handlers/group-room.socket.handlers";
import { Container } from "inversify";
import {
  notificationSocketOnConnection,
  notificationSocketOnDisconnect,
} from "./handlers/notification.socket.handlers";

export async function createSocketServer(
  httpServer = http.createServer(),
  ioc: Container,
): Promise<{
  port: number;
  httpServer: http.Server;
}> {
  const io = new Server(httpServer, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    cors: {
      origin: "*",
    },
  });

  io.use(socketAuthMiddleware({ strict: true }));

  io.on("connection", async (socket) => {
    await songStateSocketOnConnection(socket, ioc);
    await notificationSocketOnConnection(socket, io, ioc);
    groupRoomSocketHandlers(socket);

    socket.on("disconnect", () => {
      songStateSocketOnDisconnect(socket);
      notificationSocketOnDisconnect(socket);
    });
  });

  return {
    port: process.env.SOCKET_PORT
      ? parseInt(process.env.SOCKET_PORT, 10)
      : 8081,
    httpServer,
  };
}
