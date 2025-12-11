import { injectable } from "inversify";
import {
  NotificationModel,
  NotificationStatus,
} from "../db/models/notification.model";
import z from "zod";
import {
  createNotificationScheme,
  deleteNotificationScheme,
  getNotificationByIdScheme,
  getNotificationsScheme,
  markNotificationAsReadScheme,
} from "../validation/notification.scheme";
import { AppError } from "../errors/app.error";

@injectable()
export class NotificationService {
  constructor() {}

  public async getNotifications({
    userId,
    limit,
    offset,
    search,
    ids,
  }: { userId: number } & z.infer<typeof getNotificationsScheme>) {
    const notifications = await NotificationModel.query()
      .where("recipient_id", userId)
      .modify((builder) => {
        if (search) {
          builder.andWhere((qb) => {
            qb.whereILike("title", `%${search}%`).orWhereILike(
              "message",
              `%${search}%`,
            );
          });
        }

        if (ids && ids.length > 0) {
          builder.whereIn("id", ids);
        }

        if (limit) {
          builder.limit(limit);
        }

        if (offset) {
          builder.offset(offset);
        }
      })
      .orderBy("created_at", "desc");

    return notifications;
  }

  public async getNotificationById({
    userId,
    notificationId,
  }: { userId: number } & z.infer<typeof getNotificationByIdScheme>) {
    const notification = await NotificationModel.query()
      .where("recipient_id", userId)
      .andWhere("id", notificationId)
      .first();

    return notification;
  }

  public async createNotification({
    typeId,
    recipientId,
    senderId,
    relatedEntityType,
    relatedEntityId,
    title,
    message,
  }: z.infer<typeof createNotificationScheme>) {
    await NotificationModel.query().insert({
      type_id: typeId,
      recipient_id: recipientId,
      sender_id: senderId,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
      title,
      message,
      status: NotificationStatus.PENDING,
    });
  }

  public async markAsRead({
    userId,
    notificationId,
  }: { userId: number } & z.infer<typeof markNotificationAsReadScheme>) {
    const notification = await NotificationModel.query()
      .where("recipient_id", userId)
      .andWhere("id", notificationId)
      .first();

    if (!notification) {
      throw new AppError(404, "Notification not found");
    }

    await notification.$query().patch({
      is_read: true,
      read_at: new Date(),
      status: NotificationStatus.READ,
    });
  }

  public async markAllAsRead(userId: number) {
    await NotificationModel.query()
      .where("recipient_id", userId)
      .andWhere("is_read", false)
      .patch({
        is_read: true,
        read_at: new Date(),
        status: NotificationStatus.READ,
      });
  }

  public async deleteNotification({
    userId,
    notificationId,
  }: { userId: number } & z.infer<typeof deleteNotificationScheme>) {
    const notification = await NotificationModel.query()
      .where("recipient_id", userId)
      .andWhere("id", notificationId)
      .first();

    if (!notification) {
      throw new AppError(404, "Notification not found");
    }

    await notification.$query().delete();
  }
}
