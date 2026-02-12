import { inject, injectable } from "inversify";
import { SongService } from "./song.service";
import UsersService from "./users.service";
import z from "zod";
import { searchSchema } from "../validation/search.scheme";
import { PlaylistService } from "./playlist.service";
import { SearchType } from "../constants/search";
import { ISong } from "../db/models/song.model";
import { IUser } from "../db/models/user.model";
import { IPlaylist } from "../db/models/playlists.model";

@injectable()
export default class SearchService {
  constructor(
    @inject(UsersService) private usersService: UsersService,
    @inject(SongService) private songService: SongService,
    @inject(PlaylistService) private playlistService: PlaylistService,
  ) {}

  public async search({ query: search, type }: z.infer<typeof searchSchema>) {
    const promises: Promise<void>[] = [];
    const results: { songs: ISong[]; users: IUser[]; playlists: IPlaylist[] } =
      {
        songs: [],
        users: [],
        playlists: [],
      };

    if (type === SearchType.ALL || type === SearchType.SONGS) {
      promises.push(
        this.songService
          .getSongs({ search, withGenres: true })
          .then((songs) => {
            results.songs = songs;
          }),
      );
    }

    if (type === SearchType.ALL || type === SearchType.USERS) {
      promises.push(
        this.usersService.getAllUsers({ search }).then((users) => {
          results.users = users;
        }),
      );
    }

    if (type === SearchType.ALL || type === SearchType.PLAYLISTS) {
      promises.push(
        this.playlistService
          .getPlaylists({ search, withSongs: true, withOwner: true })
          .then((playlists) => {
            results.playlists = playlists;
          }),
      );
    }

    await Promise.all(promises);

    return results;
  }
}
