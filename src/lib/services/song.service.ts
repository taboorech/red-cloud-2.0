import z from "zod";
import { SongModel } from "../db/models/song.model";
import {
  createSongSchema,
  getSongsSchema,
  updateSongSchema,
} from "../validation/song.scheme";
import { AppError } from "../errors/app.error";
import { SongAuthorsModel } from "../db/models/song-authors.model";

export class SongService {
  constructor() {}

  public async getSong(id: number) {
    const song = await SongModel.query()
      .findById(id)
      .withGraphFetched("authors");

    return song;
  }

  public async getSongs({
    limit,
    offset,
    ids,
    search,
  }: z.infer<typeof getSongsSchema>) {
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
      })
      .withGraphFetched("authors");

    return songs;
  }

  public async createSong({
    title,
    language,
    duration,
    releaseYear,
    authors: requestedAuthors,
    file,
  }: z.infer<typeof createSongSchema> & { file?: Express.Multer.File }) {
    if (!file) {
      throw new AppError(400, "File is required");
    }

    const newSong = await SongModel.query().insertAndFetch({
      title,
      language,
      duration_seconds: duration,
      url: file.path,
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

    return { ...newSong, authors };
  }

  public async updateSong({
    songId,
    title,
    language,
    duration,
    authors: requestedAuthors,
  }: z.infer<typeof updateSongSchema>) {
    const song = await this.getSong(songId);
    if (!song) {
      throw new AppError(404, "Song not found");
    }

    const updatedSong = await song.$query().patchAndFetch({
      title,
      language,
      duration_seconds: duration,
    });

    const existingAuthors = await SongAuthorsModel.query().where(
      "song_id",
      songId,
    );

    if (requestedAuthors) {
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

    const updatedAuthors = await SongAuthorsModel.query().where(
      "song_id",
      songId,
    );

    return { ...updatedSong, authors: updatedAuthors };
  }

  public async deleteSong(id: number) {
    const song = await this.getSong(id);
    if (!song) {
      throw new AppError(404, "Song not found");
    }

    await song.$query().delete();
  }
}
