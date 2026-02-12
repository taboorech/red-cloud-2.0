import { Socket } from "socket.io";
import { Container } from "inversify";
import { OnlineService } from "@app/lib/services/online.service";
import { logger } from "@app/lib/logger";

export async function onlineStatusSocketOnConnection(
  socket: Socket,
  ioc: Container,
) {
  const userId = socket.handshake.auth?.user?.id;

  if (!userId) {
    logger().error("[SOCKET][ONLINE STATUS] Missing user ID on connection");
    return;
  }

  try {
    const onlineService = ioc.get(OnlineService);
    await onlineService.setUserOnline(userId);

    logger().info(`[SOCKET][ONLINE STATUS] User ${userId} is now online`);

    // Set up heartbeat interval
    const heartbeatInterval = setInterval(async () => {
      try {
        await onlineService.updateHeartbeat(userId);
      } catch (err) {
        logger().error("[SOCKET][ONLINE STATUS] Heartbeat error:", err);
      }
    }, 15000); // Update every 15 seconds

    // Store interval reference on socket for cleanup
    (socket as any).heartbeatInterval = heartbeatInterval;
  } catch (err) {
    logger().error("[SOCKET][ONLINE STATUS] Connection error:", err);
  }
}

export async function onlineStatusSocketOnDisconnect(
  socket: Socket,
  ioc: Container,
) {
  const userId = socket.handshake.auth?.user?.id;

  if (!userId) {
    return;
  }

  try {
    const onlineService = ioc.get(OnlineService);
    await onlineService.setUserOffline(userId);

    // Clear heartbeat interval
    const heartbeatInterval = (socket as any).heartbeatInterval;
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    logger().info(`[SOCKET][ONLINE STATUS] User ${userId} is now offline`);
  } catch (err) {
    logger().error("[SOCKET][ONLINE STATUS] Disconnect error:", err);
  }
}
