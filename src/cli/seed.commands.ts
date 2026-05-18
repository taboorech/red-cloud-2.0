import { Command } from "commander";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";

import { prettyLog } from "@app/lib/logger";
import { storageFolder } from "@app/lib/constants/app";
import { buildFileUrl } from "@app/lib/utils/file-save";
import { UserModel } from "@models/user.model";
import { UserProviderCredentialsModel } from "@models/user-provider-credentials.model";
import { UserSubscriptionPlanModel } from "@models/user-subscription-plan.model";
import { SongModel } from "@models/song.model";
import { SongAuthorsModel } from "@models/song-authors.model";
import { SongGenresModel } from "@models/song-genres.model";
import { GenreModel } from "@models/genres.model";
import { PlaylistModel } from "@models/playlists.model";
import { PlaylistItemModel } from "@models/playlist-item.model";
import { PlaylistMembersModel } from "@models/playlist-members.model";
import { FriendModel, FriendStatus } from "@models/friends.model";
import { FavoriteSongsModel } from "@models/favorite-songs.model";
import { UserRole } from "@app/lib/enum/user.enum";
import { Provider } from "@app/lib/enum/provider.enum";
import { SubscriptionStatus } from "@app/lib/constants/payment";

interface DemoUser {
  username: string;
  email: string;
  password: string;
  role?: string;
  country?: string;
  avatar_file?: string;
  avatar_url?: string;
}

interface DemoSongAuthor {
  username: string;
  role: string;
}

interface DemoSong {
  title: string;
  description?: string;
  text?: string;
  language?: string | null;
  duration_seconds: number;
  audio_file?: string;
  audio_url?: string;
  image_file?: string;
  image_url?: string;
  is_public?: boolean;
  metadata?: Record<string, unknown>;
  authors: DemoSongAuthor[];
  genres?: string[];
}

interface DemoPlaylist {
  title: string;
  owner: string;
  is_public?: boolean;
  image_file?: string;
  image_url?: string;
  songs?: string[];
  members?: string[];
}

interface DemoFriend {
  user: string;
  friend: string;
  status: FriendStatus;
}

interface DemoFavorite {
  user: string;
  songs: string[];
}

interface DemoData {
  users?: DemoUser[];
  songs?: DemoSong[];
  playlists?: DemoPlaylist[];
  friends?: DemoFriend[];
  favorites?: DemoFavorite[];
}

interface CommandOptions {
  data: string;
  songs: string;
  images: string;
}

let fileCounter = 0;

function copyToStorage(srcDir: string, filename: string): string {
  let src = path.resolve(srcDir, filename);
  if (!fs.existsSync(src)) {
    // macOS filesystems may store filenames in NFD; manifest may use NFC.
    const wanted = filename.normalize("NFC");
    const match = fs
      .readdirSync(srcDir)
      .find((f) => f.normalize("NFC") === wanted);
    if (!match) {
      throw new Error(`File not found: ${src}`);
    }
    src = path.join(srcDir, match);
  }
  const storageDir = path.resolve(process.cwd(), storageFolder);
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  fileCounter += 1;
  const destName = `${Date.now()}-${fileCounter}-${path.basename(filename)}`;
  const dest = path.join(storageDir, destName);
  fs.copyFileSync(src, dest);
  return buildFileUrl(`${storageFolder}/${destName}`)!;
}

function resolveMedia(
  dir: string,
  fileName?: string,
  externalUrl?: string,
): string | undefined {
  if (externalUrl) return externalUrl;
  if (fileName) return copyToStorage(dir, fileName);
  return undefined;
}

async function seedUsers(
  users: DemoUser[],
  imagesDir: string,
): Promise<Map<string, number>> {
  const usernameToId = new Map<string, number>();
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

  const freePlan = await UserSubscriptionPlanModel.knex()("subscription_plans")
    .where({ title: "Free Plan" })
    .first<{ id: number } | undefined>();

  if (!freePlan) {
    throw new Error("Free Plan not found. Run base seeds first.");
  }

  for (const u of users) {
    const avatarUrl = resolveMedia(imagesDir, u.avatar_file, u.avatar_url);
    const hashed = await bcrypt.hash(u.password, saltRounds);

    const inserted = await UserModel.query().insertAndFetch({
      username: u.username,
      email: u.email,
      avatar: avatarUrl ?? undefined,
      role: u.role ?? UserRole.USER,
      country: u.country,
    } as Partial<UserModel>);

    await UserProviderCredentialsModel.query().insert({
      user_id: inserted.id,
      provider: Provider.LOCAL,
      credentials: { password: hashed },
    } as Partial<UserProviderCredentialsModel>);

    await UserSubscriptionPlanModel.query().insert({
      user_id: Number(inserted.id),
      subscription_plan_id: freePlan.id,
      status: SubscriptionStatus.ACTIVE,
      started_at: new Date(),
      current_period_start: new Date(),
    } as Partial<UserSubscriptionPlanModel>);

    usernameToId.set(u.username, Number(inserted.id));
    prettyLog("user created:", u.username, `(id=${inserted.id})`);
  }

  // Also map base users so demo data can reference them
  const baseUsers = await UserModel.query().select("id", "username");
  for (const bu of baseUsers) {
    if (!usernameToId.has(bu.username)) {
      usernameToId.set(bu.username, Number(bu.id));
    }
  }

  return usernameToId;
}

async function seedSongs(
  songs: DemoSong[],
  audioDir: string,
  imagesDir: string,
  usernameToId: Map<string, number>,
): Promise<Map<string, number>> {
  const titleToId = new Map<string, number>();
  const genres = await GenreModel.query().select("id", "title");
  const genreToId = new Map(genres.map((g) => [g.title, g.id]));

  for (const s of songs) {
    const audioUrl = resolveMedia(audioDir, s.audio_file, s.audio_url);
    if (!audioUrl) {
      throw new Error(
        `Song "${s.title}" needs either audio_file or audio_url`,
      );
    }
    const imageUrl = resolveMedia(imagesDir, s.image_file, s.image_url);

    const inserted = await SongModel.query().insertAndFetch({
      title: s.title,
      description: s.description,
      text: s.text,
      language: s.language ?? undefined,
      duration_seconds: s.duration_seconds,
      url: audioUrl,
      image_url: imageUrl,
      is_public: s.is_public ?? true,
      metadata: s.metadata,
    } as Partial<SongModel>);

    titleToId.set(s.title, inserted.id);

    for (const author of s.authors) {
      const userId = usernameToId.get(author.username);
      if (!userId) {
        throw new Error(
          `Author "${author.username}" for song "${s.title}" not found`,
        );
      }
      await SongAuthorsModel.query().insert({
        song_id: inserted.id,
        user_id: userId,
        role: author.role,
      } as Partial<SongAuthorsModel>);
    }

    for (const genreTitle of s.genres ?? []) {
      const genreId = genreToId.get(genreTitle);
      if (!genreId) {
        throw new Error(
          `Genre "${genreTitle}" for song "${s.title}" not found`,
        );
      }
      await SongGenresModel.query().insert({
        song_id: inserted.id,
        genre_id: Number(genreId),
      } as Partial<SongGenresModel>);
    }

    prettyLog("song created:", s.title, `(id=${inserted.id})`);
  }

  const existing = await SongModel.query().select("id", "title");
  for (const row of existing) {
    if (!titleToId.has(row.title)) {
      titleToId.set(row.title, row.id);
    }
  }

  return titleToId;
}

async function seedPlaylists(
  playlists: DemoPlaylist[],
  imagesDir: string,
  usernameToId: Map<string, number>,
  titleToSongId: Map<string, number>,
): Promise<void> {
  for (const p of playlists) {
    const ownerId = usernameToId.get(p.owner);
    if (!ownerId) {
      throw new Error(`Playlist owner "${p.owner}" not found`);
    }
    const imageUrl = resolveMedia(imagesDir, p.image_file, p.image_url);

    const inserted = await PlaylistModel.query().insertAndFetch({
      title: p.title,
      image_url: imageUrl,
      owner_id: ownerId,
      is_public: p.is_public ?? false,
    } as Partial<PlaylistModel>);

    for (let i = 0; i < (p.songs?.length ?? 0); i += 1) {
      const songTitle = p.songs![i];
      const songId = titleToSongId.get(songTitle);
      if (!songId) {
        throw new Error(
          `Song "${songTitle}" for playlist "${p.title}" not found`,
        );
      }
      await PlaylistItemModel.query().insert({
        playlist_id: inserted.id,
        song_id: songId,
        position: i,
      } as Partial<PlaylistItemModel>);
    }

    for (const memberUsername of p.members ?? []) {
      const memberId = usernameToId.get(memberUsername);
      if (!memberId) {
        throw new Error(
          `Member "${memberUsername}" for playlist "${p.title}" not found`,
        );
      }
      await PlaylistMembersModel.query().insert({
        playlist_id: inserted.id,
        user_id: memberId,
      } as Partial<PlaylistMembersModel>);
    }

    prettyLog("playlist created:", p.title, `(id=${inserted.id})`);
  }
}

async function seedFriends(
  friends: DemoFriend[],
  usernameToId: Map<string, number>,
): Promise<void> {
  for (const f of friends) {
    const userId = usernameToId.get(f.user);
    const friendId = usernameToId.get(f.friend);
    if (!userId || !friendId) {
      throw new Error(`Friend pair not resolved: ${f.user} -> ${f.friend}`);
    }
    await FriendModel.query().insert({
      user_id: userId,
      friend_id: friendId,
      status: f.status,
    } as Partial<FriendModel>);
  }
  prettyLog("friendships created:", friends.length);
}

async function seedFavorites(
  favorites: DemoFavorite[],
  usernameToId: Map<string, number>,
  titleToSongId: Map<string, number>,
): Promise<void> {
  for (const fav of favorites) {
    const userId = usernameToId.get(fav.user);
    if (!userId) {
      throw new Error(`Favorites user "${fav.user}" not found`);
    }
    for (const songTitle of fav.songs) {
      const songId = titleToSongId.get(songTitle);
      if (!songId) {
        throw new Error(`Favorite song "${songTitle}" not found`);
      }
      await FavoriteSongsModel.query().insert({
        user_id: userId,
        song_id: songId,
      } as Partial<FavoriteSongsModel>);
    }
  }
  prettyLog("favorites created");
}

export function createSeedCommands(program: Command) {
  program
    .command("seed:demo")
    .description(
      "Seed demo data from a manifest + media files (default: tmp/data.json, tmp/songs, tmp/images)",
    )
    .option("-d, --data <path>", "Path to data.json manifest", "tmp/data.json")
    .option("-s, --songs <dir>", "Directory with audio files", "tmp/songs")
    .option("-i, --images <dir>", "Directory with image files", "tmp/images")
    .action(async (options: CommandOptions) => {
      if (!fs.existsSync(options.data)) {
        throw new Error(`Manifest not found: ${options.data}`);
      }
      const raw = fs.readFileSync(options.data, "utf-8");
      const data = JSON.parse(raw) as DemoData;

      prettyLog("seed:demo starting", {
        users: data.users?.length ?? 0,
        songs: data.songs?.length ?? 0,
        playlists: data.playlists?.length ?? 0,
        friends: data.friends?.length ?? 0,
        favorites: data.favorites?.length ?? 0,
      });

      const usernameToId = await seedUsers(data.users ?? [], options.images);
      const titleToSongId = await seedSongs(
        data.songs ?? [],
        options.songs,
        options.images,
        usernameToId,
      );
      await seedPlaylists(
        data.playlists ?? [],
        options.images,
        usernameToId,
        titleToSongId,
      );
      await seedFriends(data.friends ?? [], usernameToId);
      await seedFavorites(
        data.favorites ?? [],
        usernameToId,
        titleToSongId,
      );

      prettyLog("seed:demo done");
    });
}
