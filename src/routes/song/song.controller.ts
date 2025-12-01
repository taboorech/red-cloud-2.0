import { SongService } from "@app/lib/services/song.service";
import {
  createSongSchema,
  deleteSongSchema,
  getSongSchema,
  getSongsSchema,
  songActionsSchema,
  toggleFavoriteSongSchema,
  updateSongSchema,
} from "@app/lib/validation/song.scheme";
import { Request, Response } from "express";
import { inject } from "inversify";

export class SongController {
  constructor(@inject(SongService) private songService: SongService) {
    this.getSong = this.getSong.bind(this);
    this.getSongs = this.getSongs.bind(this);
    this.getFavoriteSongs = this.getFavoriteSongs.bind(this);
    this.createSong = this.createSong.bind(this);
    this.toggleFavoriteSong = this.toggleFavoriteSong.bind(this);
    this.updateSong = this.updateSong.bind(this);
    this.deleteSong = this.deleteSong.bind(this);
    this.likeSong = this.likeSong.bind(this);
    this.dislikeSong = this.dislikeSong.bind(this);
  }

  public async getSong(req: Request, res: Response) {
    const { songId, withGenres } = getSongSchema.parse(req.params);

    const song = await this.songService.getSong({
      userId: req.user!.id,
      songId,
      withGenres,
    });

    res.json({
      status: "OK",
      data: song,
    });
  }

  public async getSongs(req: Request, res: Response) {
    const data = getSongsSchema.parse(req.query);

    const songs = await this.songService.getSongs(req.user!.id, data);

    res.json({
      status: "OK",
      data: songs,
    });
  }

  public async getFavoriteSongs(req: Request, res: Response) {
    const data = getSongsSchema.parse(req.query);

    const songs = await this.songService.getFavoriteSongs(req.user!.id, data);

    res.json({
      status: "OK",
      data: songs,
    });
  }

  public async createSong(req: Request, res: Response) {
    const { authors, genres } = req.body;
    const parsedAuthors = authors ? JSON.parse(authors) : undefined;
    const parsedGenres = genres ? JSON.parse(genres) : undefined;
    const data = createSongSchema.parse({
      ...req.body,
      authors: parsedAuthors,
      genres: parsedGenres,
    });

    const files = req.files as {
      song?: Express.Multer.File[];
      image?: Express.Multer.File[];
    };

    const songFile = files.song?.[0];
    const imageFile = files.image?.[0];

    const newSong = await this.songService.createSong(req.user!.id, {
      ...data,
      song: songFile,
      image: imageFile,
    });

    res.status(201).json({
      status: "OK",
      data: newSong,
    });
  }

  public async toggleFavoriteSong(req: Request, res: Response) {
    const { songId } = toggleFavoriteSongSchema.parse(req.params);

    const isFavorite = await this.songService.toggleFavoriteSong(
      req.user!.id,
      songId,
    );

    res.json({
      status: "OK",
      data: isFavorite
        ? "Song added to favorites"
        : "Song removed from favorites",
    });
  }

  public async updateSong(req: Request, res: Response) {
    const { authors, genres } = req.body;
    const parsedAuthors = authors ? JSON.parse(authors) : undefined;
    const parsedGenres = genres ? JSON.parse(genres) : undefined;
    const data = updateSongSchema.parse({
      ...req.params,
      ...req.body,
      authors: parsedAuthors,
      genres: parsedGenres,
    });

    const updatedSong = await this.songService.updateSong(req.user!.id, {
      ...data,
      image: req.file,
    });

    res.json({
      status: "OK",
      data: updatedSong,
    });
  }

  public async deleteSong(req: Request, res: Response) {
    const { songId } = deleteSongSchema.parse(req.params);

    await this.songService.deleteSong(req.user!.id, songId);

    res.json({
      status: "OK",
    });
  }

  public async likeSong(req: Request, res: Response) {
    const { songId } = songActionsSchema.parse(req.params);

    const action = await this.songService.likeSong(req.user!.id, songId);

    res.json({
      status: "OK",
      data: action,
    });
  }

  public async dislikeSong(req: Request, res: Response) {
    const { songId } = songActionsSchema.parse(req.params);

    const action = await this.songService.dislikeSong(req.user!.id, songId);

    res.json({
      status: "OK",
      data: action,
    });
  }
}
