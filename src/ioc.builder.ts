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

export async function constructIOC(): Promise<Container> {
  const ioc = new Container();

  // <editor-fold desc="System">
  ioc.bind(GoogleClient).toSelf();
  // </editor-fold>

  // <editor-fold desc="Controllers">
  ioc.bind(AuthController).toSelf();
  ioc.bind(UsersController).toSelf();
  ioc.bind(ProfileController).toSelf();
  ioc.bind(GenreController).toSelf();

  // </editor-fold>

  // <editor-fold desc="Services">
  ioc.bind(AuthService).toSelf();
  ioc.bind(UsersService).toSelf();
  ioc.bind(ProfileService).toSelf();
  ioc.bind(UserHashCredentialsService).toSelf();
  ioc.bind(GenreService).toSelf();

  // </editor-fold>

  return ioc;
}
