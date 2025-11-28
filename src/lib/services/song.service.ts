import z from "zod";
import { SongModel } from "../db/models/song.model";
import {
  createSongSchema,
  getSongSchema,
  getSongsSchema,
  updateSongSchema,
} from "../validation/song.scheme";
import { AppError } from "../errors/app.error";

export class SongService {
  constructor() {}

  public async getSong(id: number) {
    const song = await SongModel.query().findById(id);

    return song;
  }

  public async getSongs({
    limit,
    offset,
    ids,
    search,
  }: z.infer<typeof getSongsSchema>) {
    const songs = await SongModel.query().modify((builder) => {
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
    });

    return songs;
  }

  public async createSong({
    title,
    language,
    duration,
    releaseYear,
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

    return newSong;
  }

  public async updateSong({
    songId,
    title,
    language,
    duration,
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

    return updatedSong;
  }

  public async deleteSong(id: number) {
    const song = await this.getSong(id);
    if (!song) {
      throw new AppError(404, "Song not found");
    }

    await song.$query().delete();
  }
}
