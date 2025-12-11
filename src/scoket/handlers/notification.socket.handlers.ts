import { NotificationService } from "@app/lib/services/notification.service";
import { createNotificationScheme } from "@app/lib/validation/notification.scheme";
import { Container } from "inversify";
import { Server, Socket } from "socket.io";

export async function notificationSocketOnConnection(
  socket: Socket,
  io: Server,
  ioc: Container,
) {
  const notificationSvc = ioc.get(NotificationService);
  const user = socket.handshake.auth?.user;

  if (user) {
    socket.join(`user:${user.id}:notifications`);
  }

  socket.on("notification:send", async (data) => {
    const parsedData = createNotificationScheme.parse(data);
    try {
      await notificationSvc.createNotification(parsedData);
      emitNotificationToUser(io, parsedData.recipientId, parsedData);
      socket.emit("notification:send:success", {
        message: "Notification sent successfully",
      });
    } catch (err) {
      socket.emit("notification:send:error", {
        message: "Failed to send notification",
      });
    }
  });

  socket.on("notification:read", async (data) => {
    const { userId, notificationId } = data;
    try {
      await notificationSvc.markAsRead({ userId, notificationId });
      socket.emit("notification:read:success", {
        message: "Notification marked as read",
      });
    } catch (err) {
      socket.emit("notification:read:error", {
        message: "Failed to mark notification as read",
      });
    }
  });
}

export function notificationSocketOnDisconnect(socket: Socket) {
  socket.removeAllListeners("notification:send");
  socket.removeAllListeners("notification:read");
  socket.removeAllListeners("notification:new");
}

function emitNotificationToUser(io: Server, userId: number, notification: any) {
  io.to(`user:${userId}:notifications`).emit("notification:new", notification);
}
