import z from "zod";
import { SongModel } from "../db/models/song.model";
import {
  createSongSchema,
  getSongsSchema,
  updateSongSchema,
} from "../validation/song.scheme";
import { AppError } from "../errors/app.error";
import { SongAuthorsModel } from "../db/models/song-authors.model";
import { SongGenresModel } from "../db/models/song-genres.model";
import { FavoriteSongsModel } from "../db/models/favorite-songs.model";
import { SongAction, SongActionsModel } from "../db/models/song-actions.model";
import {
  ISongListenings,
  SongListeningsModel,
} from "../db/models/song-listenings.model";
import { RedisKeyGroup, RedisUtils } from "../utils/redis";
import { ISongListeningRecord } from "../types/song";

export class SongService {
  constructor() {}

  public async getSong({
    userId,
    songId,
    withGenres,
  }: {
    userId: number;
    songId: number;
    withGenres?: boolean;
  }) {
    const song = await SongModel.query()
      .findById(songId)
      .where((builder) => {
        builder
          .where(`${SongModel.tableName}.is_active`, true)
          .orWhereExists(
            SongAuthorsModel.query()
              .select(1)
              .whereColumn(
                `${SongAuthorsModel.tableName}.song_id`,
                `${SongModel.tableName}.id`,
              )
              .where(`${SongAuthorsModel.tableName}.user_id`, userId),
          );
      })
      .modify((builder) => {
        if (withGenres) {
          builder.withGraphFetched("genres");
        }
      })
      .withGraphFetched("authors");

    return song;
  }

  public async getSongs(
    userId: number,
    {
      limit,
      offset,
      ids,
      search,
      genres,
      withGenres,
    }: z.infer<typeof getSongsSchema>,
  ) {
    const songs = await SongModel.query()
      .modify((builder) => {
        if (ids) {
          builder.whereIn("id", ids);
        }
        if (search) {
          builder.whereILike("title", `%${search}%`);
        }
        if (limit) {
          builder.limit(limit);
        }
        if (offset) {
          builder.offset(offset);
        }
        if (genres) {
          builder.whereExists(
            SongGenresModel.query()
              .select(1)
              .whereColumn(
                `${SongGenresModel.tableName}.song_id`,
                `${SongModel.tableName}.id`,
              )
              .whereIn(`${SongGenresModel.tableName}.genre_id`, genres),
          );
        }
        if (withGenres) {
          builder.withGraphFetched("genres");
        }
      })
      .where((builder) => {
        builder
          .where(`${SongModel.tableName}.is_active`, true)
          .orWhereExists(
            SongAuthorsModel.query()
              .select(1)
              .whereColumn(
                `${SongAuthorsModel.tableName}.song_id`,
                `${SongModel.tableName}.id`,
              )
              .where(`${SongAuthorsModel.tableName}.user_id`, userId),
          );
      })
      .withGraphFetched("authors");

    return songs;
  }

  public async getFavoriteSongs(
    userId: number,
    {
      limit,
      offset,
      ids,
      search,
      genres,
      withGenres,
    }: z.infer<typeof getSongsSchema>,
  ) {
    const favoriteSongs = await SongModel.query()
      .leftJoin(
        `${FavoriteSongsModel.tableName}`,
        `${FavoriteSongsModel.tableName}.song_id`,
        `${SongModel.tableName}.id`,
      )
      .where(`${FavoriteSongsModel.tableName}.user_id`, userId)
      .modify((builder) => {
        if (ids) {
          builder.whereIn(`${SongModel.tableName}.id`, ids);
        }

        if (search) {
          builder.whereILike(`${SongModel.tableName}.title`, `%${search}%`);
        }

        if (limit) {
          builder.limit(limit);
        }

        if (offset) {
          builder.offset(offset);
        }

        if (genres) {
          builder.whereExists(
            SongGenresModel.query()
              .select(1)
              .whereColumn(
                `${SongGenresModel.tableName}.song_id`,
                `${SongModel.tableName}.id`,
              )
              .whereIn(`${SongGenresModel.tableName}.genre_id`, genres),
          );
        }

        if (withGenres) {
          builder.withGraphFetched("genres");
        }
      })
      .withGraphFetched("authors");

    return favoriteSongs;
  }

  public async createSong(
    userId: number,
    {
      title,
      description,
      text,
      language,
      duration,
      releaseYear,
      isActive,
      authors: requestedAuthors,
      genres: requestedGenres,
      song,
      image,
    }: z.infer<typeof createSongSchema> & {
      song?: Express.Multer.File;
      image?: Express.Multer.File;
    },
  ) {
    if (!song) {
      throw new AppError(400, "Song file is required");
    }

    if (!image) {
      throw new AppError(400, "Image file is required");
    }

    if (!requestedAuthors?.find((a) => a.userId === userId)) {
      throw new AppError(403, "You must be an author of the song");
    }

    const newSong = await SongModel.query().insertAndFetch({
      title,
      description,
      text,
      language,
      duration_seconds: duration,
      url: song.path,
      image_url: image?.path,
      is_active: isActive ?? true,
      metadata: releaseYear ? { release_year: releaseYear } : undefined,
    });

    const authors = requestedAuthors?.length
      ? await Promise.all(
          requestedAuthors.map(async (author) => {
            return await SongAuthorsModel.query().insert({
              song_id: newSong.id,
              user_id: author.userId,
              role: author.role,
            });
          }),
        )
      : [];

    requestedGenres?.length
      ? await Promise.all(
          requestedGenres.map(async (genreId) => {
            return await SongGenresModel.query().insert({
              song_id: newSong.id,
              genre_id: genreId,
            });
          }),
        )
      : [];

    return { ...newSong, authors };
  }

  public async toggleFavoriteSong(userId: number, songId: number) {
    const song = await this.getSong({ userId, songId });
    if (!song) {
      throw new AppError(404, "Song not found");
    }

    const favorite = await FavoriteSongsModel.query().findOne({
      user_id: userId,
      song_id: songId,
    });

    if (favorite) {
      await favorite.$query().delete();

      return false;
    } else {
      await FavoriteSongsModel.query().insert({
        user_id: userId,
        song_id: songId,
      });

      return true;
    }
  }

  public async updateSong(
    userId: number,
    {
      songId,
      title,
      description,
      text,
      language,
      duration,
      releaseYear,
      isActive,
      authors: requestedAuthors,
      genres: requestedGenres,
      image,
    }: z.infer<typeof updateSongSchema> & { image?: Express.Multer.File },
  ) {
    const song = await this.getSong({ userId, songId });
    if (!song) {
      throw new AppError(404, "Song not found");
    }

    if (song.authors?.every((author) => author.user_id !== userId)) {
      throw new AppError(403, "You are not authorized to update this song");
    }

    if (
      requestedAuthors &&
      !requestedAuthors.find((a) => a.userId === userId)
    ) {
      throw new AppError(403, "You must be an author of the song");
    }

    const updatedSong = await song.$query().patchAndFetch({
      title,
      description,
      text,
      language,
      duration_seconds: duration,
      is_active: isActive,
      image_url: image ? image.path : song.image_url,
      metadata: releaseYear
        ? { ...(song.metadata || {}), release_year: releaseYear }
        : song.metadata,
    });

    if (requestedAuthors) {
      const existingAuthors = await SongAuthorsModel.query().where(
        "song_id",
        songId,
      );

      await Promise.all([
        await SongAuthorsModel.query()
          .where("song_id", songId)
          .whereNotIn(
            "user_id",
            requestedAuthors.map((a) => a.userId),
          )
          .delete(),
        await Promise.all(
          requestedAuthors.map(async (author) => {
            const existingAuthor = existingAuthors.find(
              (a) => a.user_id === author.userId,
            );
            if (existingAuthor) {
              if (existingAuthor.role !== author.role) {
                await SongAuthorsModel.query()
                  .findById(existingAuthor.id)
                  .patch({ role: author.role });
              }
            } else {
              await SongAuthorsModel.query().insert({
                song_id: songId,
                user_id: author.userId,
                role: author.role,
              });
            }
          }),
        ),
      ]);
    }

    if (requestedGenres) {
      const existingGenres = await SongGenresModel.query().where(
        "song_id",
        songId,
      );

      await Promise.all([
        await SongGenresModel.query()
          .where("song_id", songId)
          .whereNotIn("genre_id", requestedGenres)
          .delete(),
        await Promise.all(
          requestedGenres.map(async (genreId) => {
            const existingGenre = existingGenres.find(
              (g) => g.genre_id === genreId,
            );
            if (!existingGenre) {
              await SongGenresModel.query().insert({
                song_id: songId,
                genre_id: genreId,
              });
            }
          }),
        ),
      ]);
    }

    const updatedAuthors = await SongAuthorsModel.query().where(
      "song_id",
      songId,
    );

    return { ...updatedSong, authors: updatedAuthors };
  }

  public async deleteSong(userId: number, songId: number) {
    const song = await this.getSong({ userId, songId });
    if (!song) {
      throw new AppError(404, "Song not found");
    }

    if (song.authors?.every((author) => author.user_id !== userId)) {
      throw new AppError(403, "You are not authorized to delete this song");
    }

    await song.$query().delete();
  }

  private async songAction(userId: number, songId: number, action: SongAction) {
    const song = await this.getSong({ userId, songId });
    if (!song) {
      throw new AppError(404, "Song not found");
    }

    const existingAction = await SongActionsModel.query().findOne({
      user_id: userId,
      song_id: songId,
    });

    if (existingAction) {
      if (existingAction.action === action) {
        await existingAction.$query().delete();

        return null;
      } else {
        await existingAction.$query().patch({ action });

        return existingAction;
      }
    } else {
      const newAction = await SongActionsModel.query().insert({
        user_id: userId,
        song_id: songId,
        action,
      });

      return newAction;
    }
  }

  public async likeSong(userId: number, songId: number) {
    return this.songAction(userId, songId, SongAction.LIKE);
  }

  public async dislikeSong(userId: number, songId: number) {
    return this.songAction(userId, songId, SongAction.DISLIKE);
  }

  public async recordListening({
    userId,
    songId,
    durationListened,
    totalDuration,
  }: {
    userId: number;
    songId: number;
    durationListened: number;
    totalDuration: number;
  }): Promise<ISongListenings | ISongListeningRecord | null> {
    const redisKey = `user:${userId}:song:${songId}:listening_recorded`;
    const completionPercentage = (durationListened / totalDuration) * 100;

    if (completionPercentage < 65) {
      return null;
    }

    const record = await RedisUtils.getRedisKey({
      group: RedisKeyGroup.APP,
      key: redisKey,
    });

    if (record) {
      if (completionPercentage >= 100) {
        await RedisUtils.removeRedisKey({
          group: RedisKeyGroup.APP,
          key: redisKey,
        });
      }

      return JSON.parse(record) as ISongListeningRecord;
    }

    const allKeysPattern = `user:${userId}:song:*:listening_recorded`;

    const existingKeys = await RedisUtils.getRedisKeys({
      group: RedisKeyGroup.APP,
      pattern: allKeysPattern,
    });

    if (existingKeys.length > 0) {
      const keysToDelete = existingKeys.filter(
        (key) => !key.includes(`:song:${songId}:`),
      );
      if (keysToDelete.length > 0) {
        await RedisUtils.removeRedisKeys({
          group: RedisKeyGroup.APP,
          pattern: allKeysPattern,
        });
      }
    }

    const listening = await SongListeningsModel.query().insert({
      user_id: userId,
      song_id: songId,
    });

    await RedisUtils.setRedisKey({
      group: RedisKeyGroup.APP,
      key: redisKey,
      value: JSON.stringify({ songId, listeningId: listening.id, userId }),
      ttl: 7 * 24 * 60 * 60,
    });

    return listening;
  }
}
