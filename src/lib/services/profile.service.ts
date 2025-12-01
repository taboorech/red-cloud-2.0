import { injectable } from "inversify";
import z from "zod";
import {
  changeUserPasswordValidation,
  updateProfileSchema,
} from "../validation/profile.scheme";
import { IUser, UserModel } from "../db/models/user.model";
import { AppError } from "../errors/app.error";
import { UserProviderCredentialsModel } from "../db/models/user-provider-credentials.model";
import { Provider } from "../enum/provider.enum";
import * as bcrypt from "bcrypt";
import { SubscriptionStatus } from "../constants/payment";

@injectable()
export default class ProfileService {
  constructor() {}

  public async getProfile({
    userId,
    withSubscription = false,
    withSongs = false,
  }: {
    userId: number;
    withSubscription?: boolean;
    withSongs?: boolean;
  }): Promise<IUser> {
    const user = await UserModel.query()
      .findOne(`${UserModel.tableName}.id`, userId)
      .modify((builder) => {
        if (withSubscription) {
          builder
            .withGraphFetched("subscription")
            .modifyGraph("subscription", (subBuilder) => {
              subBuilder.where("status", SubscriptionStatus.ACTIVE);
            });
        }
        if (withSongs) {
          builder.withGraphFetched("songs");
        }
      });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    return user;
  }

  public async updateProfile({
    userId,
    username,
    country,
  }: z.infer<typeof updateProfileSchema>): Promise<IUser> {
    const user = await UserModel.query().findOne({ id: userId });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const updatedUser = await user.$query().patchAndFetch({
      username,
      country,
    });

    return updatedUser;
  }

  public async changeUserPassword({
    userId,
    currentPassword,
    password,
  }: z.infer<typeof changeUserPasswordValidation>): Promise<void> {
    const user = await UserModel.query().findOne({ id: userId });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const credentials = await UserProviderCredentialsModel.query().findOne({
      user_id: user.id,
      provider: Provider.LOCAL,
    });

    if (!credentials || !credentials.credentials?.password) {
      throw new AppError(
        400,
        "Password change not allowed: No local credentials found",
      );
    }

    if (!currentPassword) {
      throw new AppError(400, "Current password can\'t be empty");
    }

    const isValidCurrentPassword = await bcrypt.compare(
      currentPassword,
      credentials.credentials.password,
    );
    if (!isValidCurrentPassword) {
      throw new AppError(400, "Current password is incorrect");
    }

    const newPassword = await bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_SALT_ROUNDS || "10"),
    );

    await UserProviderCredentialsModel.query()
      .update({
        credentials: {
          ...credentials.credentials,
          password: newPassword,
        },
      })
      .where({ id: credentials.id });
  }
}
