import { Container } from "inversify";
import "reflect-metadata";
import AuthController from "./routes/auth/auth.controller";
import { AuthService } from "./lib/services/auth.service";
import { GoogleClient } from "./lib/google/google.client";
import UsersController from "./routes/users/users.controller";
import UsersService from "./lib/services/users.service";
import ProfileController from "./routes/profile/profile.controller";
import ProfileService from "./lib/services/profile.service";
import { UserHashCredentialsService } from "./lib/services/user-hash-credentials.sevice";
import GenreController from "./routes/genre/genre.controller";
import GenreService from "./lib/services/genre.service";
import PaymentController from "./routes/payment/payment.controller";
import { PaymentService } from "./lib/services/payment.service";
import { SubscriptionJobHandler } from "./worker/handlers/subscription";
import { SongController } from "./routes/song/song.controller";
import { SongService } from "./lib/services/song.service";
import { PlaylistController } from "./routes/playlist/playlist.controller";
import { PlaylistService } from "./lib/services/playlist.service";
import { NotificationController } from "./routes/notification/notification.controller";
import { NotificationService } from "./lib/services/notification.service";
import { AIController } from "./routes/ai/ai.controller";
import { AIService } from "./lib/services/ai.service";
import { LyricsService } from "./lib/services/lyrics.service";
import { DeepLClient } from "./lib/deepl/deepl.client";
import { LyricsController } from "./routes/lyrics/lyrics.controller";

export async function constructIOC(): Promise<Container> {
  const ioc = new Container();

  // <editor-fold desc="System">
  ioc.bind(GoogleClient).toSelf();
  ioc.bind(DeepLClient).toSelf();
  ioc.bind(SubscriptionJobHandler).toSelf().inSingletonScope();
  // </editor-fold>

  // <editor-fold desc="Controllers">
  ioc.bind(AuthController).toSelf();
  ioc.bind(UsersController).toSelf();
  ioc.bind(ProfileController).toSelf();
  ioc.bind(GenreController).toSelf();
  ioc.bind(PaymentController).toSelf();
  ioc.bind(SongController).toSelf();
  ioc.bind(PlaylistController).toSelf();
  ioc.bind(NotificationController).toSelf();
  ioc.bind(AIController).toSelf();
  ioc.bind(LyricsController).toSelf();

  // </editor-fold>

  // <editor-fold desc="Services">
  ioc.bind(AuthService).toSelf();
  ioc.bind(UsersService).toSelf();
  ioc.bind(ProfileService).toSelf();
  ioc.bind(UserHashCredentialsService).toSelf();
  ioc.bind(GenreService).toSelf();
  ioc.bind(PaymentService).toSelf();
  ioc.bind(SongService).toSelf();
  ioc.bind(PlaylistService).toSelf();
  ioc.bind(NotificationService).toSelf();
  ioc.bind(AIService).toSelf();
  ioc.bind(LyricsService).toSelf();

  // </editor-fold>

  return ioc;
}
