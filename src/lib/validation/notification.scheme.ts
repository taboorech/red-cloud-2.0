import { z as zod } from "zod";
import { paginationValidation } from "./main.scheme";

const notificationIdSchema = zod.object({
  notificationId: zod.coerce.number().int().positive(),
});

const getNotificationsScheme = paginationValidation;
const getNotificationByIdScheme = notificationIdSchema;

const markNotificationAsReadScheme = notificationIdSchema;
const deleteNotificationScheme = notificationIdSchema;

const createNotificationScheme = zod.object({
  typeId: zod.number().int().positive(),
  recipientId: zod.number().int().positive(),
  senderId: zod.number().int().positive(),
  relatedEntityType: zod.string().nullable(),
  relatedEntityId: zod.number().int().positive().nullable(),
  title: zod.string().min(1).max(255),
  message: zod.string().min(1).max(2000),
});

export {
  getNotificationsScheme,
  getNotificationByIdScheme,
  createNotificationScheme,
  markNotificationAsReadScheme,
  deleteNotificationScheme,
};
