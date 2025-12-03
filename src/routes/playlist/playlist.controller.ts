import { PlaylistService } from "@app/lib/services/playlist.service";
import {
  addSongToPlaylistSchema,
  createPlaylistSchema,
  deletePlaylistSchema,
  getPlaylistByIdSchema,
  getPlaylistsSchema,
  removeSongFromPlaylistSchema,
  updatePlaylistOrderSchema,
  updatePlaylistSchema,
} from "@app/lib/validation/playlist.scheme";
import { Request, Response } from "express";
import { inject } from "inversify";

export class PlaylistController {
  constructor(
    @inject(PlaylistService) private playlistService: PlaylistService,
  ) {
    this.getPlaylistById = this.getPlaylistById.bind(this);
    this.getPlaylists = this.getPlaylists.bind(this);
    this.createPlaylist = this.createPlaylist.bind(this);
    this.updatePlaylist = this.updatePlaylist.bind(this);
    this.addSongToPlaylist = this.addSongToPlaylist.bind(this);
    this.updatePlaylistOrder = this.updatePlaylistOrder.bind(this);
    this.removeSongFromPlaylist = this.removeSongFromPlaylist.bind(this);
    this.deletePlaylist = this.deletePlaylist.bind(this);
  }

  public async getPlaylistById(req: Request, res: Response) {
    const data = getPlaylistByIdSchema.parse(req.params);

    const playlist = await this.playlistService.getPlaylistById({
      userId: req.user!.id,
      ...data,
    });

    res.json({
      status: "OK",
      data: playlist,
    });
  }

  public async getPlaylists(req: Request, res: Response) {
    const data = getPlaylistsSchema.parse(req.query);

    const playlists = await this.playlistService.getPlaylists({
      userId: req.user!.id,
      ...data,
    });

    res.json({
      status: "OK",
      data: playlists,
    });
  }

  public async createPlaylist(req: Request, res: Response) {
    const data = createPlaylistSchema.parse({ ...req.params, ...req.body });

    const playlist = await this.playlistService.createPlaylist({
      userId: req.user!.id,
      ...data,
    });

    res.json({
      status: "OK",
      data: playlist,
    });
  }

  public async updatePlaylist(req: Request, res: Response) {
    const data = updatePlaylistSchema.parse({ ...req.params, ...req.body });

    const playlist = await this.playlistService.updatePlaylist({
      userId: req.user!.id,
      ...data,
    });

    res.json({
      status: "OK",
      data: playlist,
    });
  }

  public async addSongToPlaylist(req: Request, res: Response) {
    const data = addSongToPlaylistSchema.parse({ ...req.params, ...req.body });

    await this.playlistService.addSongToPlaylist({
      userId: req.user!.id,
      ...data,
    });

    res.json({
      status: "OK",
    });
  }

  public async updatePlaylistOrder(req: Request, res: Response) {
    const data = updatePlaylistOrderSchema.parse({
      ...req.params,
      ...req.body,
    });

    await this.playlistService.updatePlaylistOrder({
      userId: req.user!.id,
      ...data,
    });

    res.json({
      status: "OK",
    });
  }

  public async removeSongFromPlaylist(req: Request, res: Response) {
    const data = removeSongFromPlaylistSchema.parse(req.params);

    await this.playlistService.removeSongFromPlaylist({
      userId: req.user!.id,
      ...data,
    });

    res.json({
      status: "OK",
    });
  }

  public async deletePlaylist(req: Request, res: Response) {
    const data = deletePlaylistSchema.parse(req.params);

    await this.playlistService.deletePlaylist({
      userId: req.user!.id,
      ...data,
    });

    res.json({
      status: "OK",
    });
  }
}
