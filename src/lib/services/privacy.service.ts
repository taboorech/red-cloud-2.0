import { injectable } from "inversify";
import { z } from "zod";
import {
  DEFAULT_PRIVACY_SETTINGS,
  IUserPrivacySettings,
  UserPrivacySettingsModel,
  VisibilityLevel,
} from "../db/models/user-privacy-settings.model";
import {
  ExclusionScope,
  UserPrivacyExclusionModel,
} from "../db/models/user-privacy-exclusion.model";
import { FriendModel, FriendStatus } from "../db/models/friends.model";
import { AppError } from "../errors/app.error";
import { publishPrivacyChange } from "../utils/privacy-broadcaster";
import { updatePrivacyValidation } from "../validation/privacy.scheme";

@injectable()
export class PrivacyService {
  public async getSettings(
    userId: number,
  ): Promise<
    Pick<IUserPrivacySettings, "listening_visibility" | "presence_visibility">
  > {
    const row = await UserPrivacySettingsModel.query().findOne({
      user_id: userId,
    });
    return row ?? DEFAULT_PRIVACY_SETTINGS;
  }

  public async updateSettings(
    userId: number,
    patch: z.infer<typeof updatePrivacyValidation>,
  ): Promise<IUserPrivacySettings> {
    const existing = await UserPrivacySettingsModel.query().findOne({
      user_id: userId,
    });
    const result = existing
      ? await existing.$query().patchAndFetch(patch)
      : await UserPrivacySettingsModel.query().insertAndFetch({
          user_id: userId,
          ...DEFAULT_PRIVACY_SETTINGS,
          ...patch,
        });
    await publishPrivacyChange(userId);
    return result;
  }

  public async listHiddenFrom(
    userId: number,
    scope: ExclusionScope,
  ): Promise<number[]> {
    const rows = await UserPrivacyExclusionModel.query()
      .where("user_id", userId)
      .where("scope", scope)
      .select("excluded_user_id");
    return rows.map((r) => r.excluded_user_id);
  }

  public async hideFrom(
    userId: number,
    friendId: number,
    scope: ExclusionScope,
  ): Promise<void> {
    if (userId === friendId) {
      throw new AppError(400, "Cannot hide activity from yourself");
    }
    const friendship = await FriendModel.query()
      .where({
        user_id: userId,
        friend_id: friendId,
        status: FriendStatus.accepted,
      })
      .first();
    if (!friendship) {
      throw new AppError(404, "Friend not found");
    }
    await UserPrivacyExclusionModel.query()
      .insert({ user_id: userId, excluded_user_id: friendId, scope })
      .onConflict(["user_id", "excluded_user_id", "scope"])
      .ignore();
    await publishPrivacyChange(userId);
  }

  public async unhideFrom(
    userId: number,
    friendId: number,
    scope: ExclusionScope,
  ): Promise<void> {
    await UserPrivacyExclusionModel.query()
      .delete()
      .where({ user_id: userId, excluded_user_id: friendId, scope });
    await publishPrivacyChange(userId);
  }

  public async filterPresenceRecipients(
    ownerId: number,
    friendIds: number[],
  ): Promise<number[]> {
    if (friendIds.length === 0) return [];
    const settings = await this.getSettings(ownerId);
    const exceptions = new Set(
      await this.listHiddenFrom(ownerId, "presence"),
    );

    if (settings.presence_visibility === "nobody") {
      // whitelist: only listed exceptions can see
      return friendIds.filter((id) => exceptions.has(id));
    }
    // blacklist: everyone allowed except the exceptions
    return friendIds.filter((id) => !exceptions.has(id));
  }

  public async filterListeningRecipients(
    ownerId: number,
    friendIds: number[],
  ): Promise<number[]> {
    if (friendIds.length === 0) return [];
    // cascade: presence gates listening — only those who can see presence are candidates
    const presenceRecipients = await this.filterPresenceRecipients(
      ownerId,
      friendIds,
    );
    if (presenceRecipients.length === 0) return [];

    const settings = await this.getSettings(ownerId);
    const exceptions = new Set(
      await this.listHiddenFrom(ownerId, "listening"),
    );

    if (settings.listening_visibility === "nobody") {
      return presenceRecipients.filter((id) => exceptions.has(id));
    }
    return presenceRecipients.filter((id) => !exceptions.has(id));
  }

  public async canViewPresence(
    viewerId: number,
    ownerId: number,
  ): Promise<boolean> {
    if (viewerId === ownerId) return true;
    const settings = await this.getSettings(ownerId);
    const isException = await this.exclusionExists(
      ownerId,
      viewerId,
      "presence",
    );

    if (settings.presence_visibility === "nobody") {
      // whitelist: only listed exceptions can see
      return isException;
    }
    if (isException) return false; // blacklist
    if (settings.presence_visibility === "everyone") return true;
    return this.friendshipExists(ownerId, viewerId);
  }

  public async canViewListening(
    viewerId: number,
    ownerId: number,
  ): Promise<boolean> {
    if (viewerId === ownerId) return true;
    // cascade: presence gates listening (both global and per-friend)
    if (!(await this.canViewPresence(viewerId, ownerId))) return false;

    const settings = await this.getSettings(ownerId);
    const isException = await this.exclusionExists(
      ownerId,
      viewerId,
      "listening",
    );

    if (settings.listening_visibility === "nobody") {
      return isException;
    }
    if (isException) return false;
    if (settings.listening_visibility === "everyone") return true;
    return this.friendshipExists(ownerId, viewerId);
  }

  private async exclusionExists(
    ownerId: number,
    viewerId: number,
    scope: ExclusionScope,
  ): Promise<boolean> {
    const row = await UserPrivacyExclusionModel.query()
      .where({ user_id: ownerId, excluded_user_id: viewerId, scope })
      .first();
    return Boolean(row);
  }

  private async friendshipExists(
    ownerId: number,
    viewerId: number,
  ): Promise<boolean> {
    const row = await FriendModel.query()
      .where({
        user_id: ownerId,
        friend_id: viewerId,
        status: FriendStatus.accepted,
      })
      .first();
    return Boolean(row);
  }
}
