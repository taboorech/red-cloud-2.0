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
}
