import Model from "../knex-objection";

export enum NotificationStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
  READ = "read",
  RESPONDED = "responded",
}

export enum NotificationRelatedEntityType {
  PLAYLIST = "playlist",
}

export interface INotificationMetadata {}

export interface INotification {
  id: number;
  type_id: number;
  recipient_id: number;
  sender_id: number | null;
  related_entity_type: string | null;
  related_entity_id: number | null;
  title: string;
  message: string | null;
  metadata?: INotificationMetadata;
  status: NotificationStatus;
  is_read: boolean;
  read_at: Date | null;
  responded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class NotificationModel extends Model implements INotification {
  static tableName = "notifications";

  id!: number;
  type_id!: number;
  recipient_id!: number;
  sender_id!: number | null;
  related_entity_type!: string | null;
  related_entity_id!: number | null;
  title!: string;
  message!: string | null;
  metadata?: INotificationMetadata;
  status!: NotificationStatus;
  is_read!: boolean;
  read_at!: Date | null;
  responded_at!: Date | null;
  created_at!: Date;
  updated_at!: Date;
}
