import { Router } from "express";
import { Container } from "inversify";
import { NotificationController } from "./notification.controller";

const createNotificationRoutes = (ioc: Container): Router => {
  const router = Router();

  const ctrl = ioc.get(NotificationController);

  router.get("/", ctrl.getNotifications);
  router.get("/:notificationId", ctrl.getNotificationById);
  router.post("/:notificationId/mark-as-read", ctrl.markAsRead);
  router.post("/mark-all-as-read", ctrl.markAllAsRead);
  router.delete("/:notificationId", ctrl.deleteNotification);

  return router;
};

export { createNotificationRoutes };
