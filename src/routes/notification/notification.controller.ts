import { NotificationService } from "@app/lib/services/notification.service";
import {
  deleteNotificationScheme,
  getNotificationByIdScheme,
  getNotificationsScheme,
  markNotificationAsReadScheme,
} from "@app/lib/validation/notification.scheme";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class NotificationController {
  constructor(
    @inject(NotificationService)
    private notificationService: NotificationService,
  ) {
    this.getNotifications = this.getNotifications.bind(this);
    this.getNotificationById = this.getNotificationById.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
    this.deleteNotification = this.deleteNotification.bind(this);
  }

  public async getNotifications(req: Request, res: Response) {
    const data = getNotificationsScheme.parse(req.query);
    const notifications = await this.notificationService.getNotifications({
      userId: req.user!.id,
      ...data,
    });

    res.json({ status: "OK", data: notifications });
  }

  public async getNotificationById(req: Request, res: Response) {
    const data = getNotificationByIdScheme.parse(req.params);
    const notification = await this.notificationService.getNotificationById({
      userId: req.user!.id,
      ...data,
    });

    res.json({ status: "OK", data: notification });
  }

  public async markAsRead(req: Request, res: Response) {
    const data = markNotificationAsReadScheme.parse(req.params);
    await this.notificationService.markAsRead({
      userId: req.user!.id,
      ...data,
    });

    res.json({ status: "OK" });
  }

  public async markAllAsRead(req: Request, res: Response) {
    await this.notificationService.markAllAsRead(req.user!.id);

    res.json({ status: "OK" });
  }

  public async deleteNotification(req: Request, res: Response) {
    const data = deleteNotificationScheme.parse(req.params);
    await this.notificationService.deleteNotification({
      userId: req.user!.id,
      ...data,
    });

    res.json({ status: "OK" });
  }
}
