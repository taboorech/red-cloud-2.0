import { SongService } from "@app/lib/services/song.service";
import {
  createSongSchema,
  deleteSongSchema,
  getSongSchema,
  getSongsSchema,
  updateSongSchema,
} from "@app/lib/validation/song.scheme";
import { Request, Response } from "express";
import { inject } from "inversify";

export class SongController {
  constructor(@inject(SongService) private songService: SongService) {
    this.getSong = this.getSong.bind(this);
    this.getSongs = this.getSongs.bind(this);
    this.createSong = this.createSong.bind(this);
    this.updateSong = this.updateSong.bind(this);
    this.deleteSong = this.deleteSong.bind(this);
  }

  public async getSong(req: Request, res: Response) {
    const { songId } = getSongSchema.parse(req.params);

    const song = await this.songService.getSong(songId);

    res.json({
      status: "OK",
      data: song,
    });
  }

  public async getSongs(req: Request, res: Response) {
    const data = getSongsSchema.parse(req.query);

    const songs = await this.songService.getSongs(data);

    res.json({
      status: "OK",
      data: songs,
    });
  }

  public async createSong(req: Request, res: Response) {
    const data = createSongSchema.parse(req.body);

    const newSong = await this.songService.createSong({
      ...data,
      file: req.file,
    });

    res.status(201).json({
      status: "OK",
      data: newSong,
    });
  }

  public async updateSong(req: Request, res: Response) {
    const data = updateSongSchema.parse({
      ...req.params,
      ...req.body,
    });

    const updatedSong = await this.songService.updateSong(data);

    res.json({
      status: "OK",
      data: updatedSong,
    });
  }

  public async deleteSong(req: Request, res: Response) {
    const { songId } = deleteSongSchema.parse(req.params);

    await this.songService.deleteSong(songId);

    res.json({
      status: "OK",
    });
  }
}
