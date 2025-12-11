import { NotificationType } from "@app/lib/constants/app";
import Model from "../knex-objection";

export interface INotificationType {
  id: number;
  code: NotificationType;
  title: string;
  description: string | null;
  requires_action: boolean;
  created_at: Date;
  updated_at: Date;
}

export class NotificationTypeModel extends Model implements INotificationType {
  static tableName = "notification_types";

  id!: number;
  code!: NotificationType;
  title!: string;
  description!: string | null;
  requires_action!: boolean;
  created_at!: Date;
  updated_at!: Date;
}
