import z from "zod";
import { IPlaylist, PlaylistModel } from "../db/models/playlists.model";
import {
  addSongToPlaylistSchema,
  createPlaylistSchema,
  deletePlaylistSchema,
  getPlaylistByIdSchema,
  getPlaylistsSchema,
  removeSongFromPlaylistSchema,
  updatePlaylistOrderSchema,
  updatePlaylistSchema,
} from "../validation/playlist.scheme";
import { AppError } from "../errors/app.error";
import { PlaylistItemModel } from "../db/models/playlist-item.model";
import { PlaylistMembersModel } from "../db/models/playlist-members.model";

export class PlaylistService {
  constructor() {}

  public async getPlaylistById({
    userId,
    playlistId,
    withSongs,
  }: {
    userId: number;
  } & z.infer<typeof getPlaylistByIdSchema>): Promise<IPlaylist> {
    const playlist = await PlaylistModel.query()
      .where("id", playlistId)
      .where((builder) => {
        builder
          .where("is_public", true)
          .orWhere("owner_id", userId)
          .orWhereExists((subQuery) => {
            subQuery
              .select("*")
              .from(PlaylistMembersModel.tableName)
              .whereRaw(
                `${PlaylistMembersModel.tableName}.playlist_id = playlists.id`,
              )
              .andWhere(`${PlaylistMembersModel.tableName}.user_id`, userId);
          });
      })
      .modify((builder) => {
        if (withSongs) {
          builder.withGraphFetched("songs");
        }
      })
      .first();

    if (!playlist) {
      throw new AppError(404, "Playlist not found");
    }

    return playlist;
  }

  public async getPlaylists({
    userId,
    offset,
    limit,
    ids,
    search,
    withSongs,
    withOwner,
  }: {
    userId: number;
  } & z.infer<typeof getPlaylistsSchema>): Promise<IPlaylist[]> {
    const playlists = await PlaylistModel.query().modify((builder) => {
      if (ids && ids.length > 0) {
        builder.whereIn("id", ids);
      }

      if (search) {
        builder.where("title", "ilike", `%${search}%`);
      }

      builder.where((subBuilder) => {
        subBuilder
          .where("is_public", true)
          .orWhere("owner_id", userId)
          .orWhereExists((subQuery) => {
            subQuery
              .select("*")
              .from(PlaylistMembersModel.tableName)
              .whereRaw(
                `${PlaylistMembersModel.tableName}.playlist_id = playlists.id`,
              )
              .andWhere(`${PlaylistMembersModel.tableName}.user_id`, userId);
          });
      });

      if (limit) {
        builder.limit(limit);
      }

      if (offset) {
        builder.offset(offset);
      }

      if (withSongs) {
        builder.withGraphFetched("songs");
      }

      if (withOwner) {
        builder.withGraphFetched("owner");
      }
    });

    return playlists;
  }

  public async createPlaylist({
    userId,
    title,
    isPublic,
  }: {
    userId: number;
  } & z.infer<typeof createPlaylistSchema>) {
    const newPlaylist = await PlaylistModel.query().insertAndFetch({
      title,
      is_public: isPublic ?? false,
      owner_id: userId,
    });

    return newPlaylist;
  }

  public async updatePlaylist({
    userId,
    playlistId,
    title,
    isPublic,
  }: {
    userId: number;
  } & z.infer<typeof updatePlaylistSchema>) {
    const playlist = await PlaylistModel.query()
      .where("id", playlistId)
      .andWhere("owner_id", userId)
      .first();

    if (!playlist) {
      throw new AppError(404, "Playlist not found");
    }

    const updatedPlaylist = await PlaylistModel.query()
      .where("id", playlistId)
      .update({
        title: title ?? playlist.title,
        is_public: isPublic ?? playlist.is_public,
      })
      .returning("*")
      .first();

    return updatedPlaylist;
  }

  public async addSongToPlaylist({
    userId,
    playlistId,
    songId,
    position,
  }: {
    userId: number;
  } & z.infer<typeof addSongToPlaylistSchema>) {
    const playlist = await PlaylistModel.query()
      .where("id", playlistId)
      .andWhere("owner_id", userId)
      .first();

    if (!playlist) {
      throw new AppError(404, "Playlist not found");
    }

    const existingSongs = await PlaylistItemModel.query()
      .where("playlist_id", playlistId)
      .andWhere("song_id", songId);

    if (existingSongs.length > 0) {
      throw new AppError(400, "Song already in playlist");
    }

    await PlaylistItemModel.query().insert({
      playlist_id: playlistId,
      song_id: songId,
      position,
    });
  }

  public async updatePlaylistOrder({
    userId,
    playlistId,
    songs,
  }: {
    userId: number;
  } & z.infer<typeof updatePlaylistOrderSchema>) {
    const playlist = await PlaylistModel.query()
      .where("id", playlistId)
      .andWhere("owner_id", userId)
      .first();

    if (!playlist) {
      throw new AppError(404, "Playlist not found");
    }

    const updatePromises = songs.map(({ songId, position }) =>
      PlaylistItemModel.query()
        .where("playlist_id", playlistId)
        .andWhere("song_id", songId)
        .update({ position }),
    );

    await Promise.all(updatePromises);
  }

  public async removeSongFromPlaylist({
    userId,
    playlistId,
    songId,
  }: {
    userId: number;
  } & z.infer<typeof removeSongFromPlaylistSchema>) {
    const playlist = await PlaylistModel.query()
      .where("id", playlistId)
      .andWhere("owner_id", userId)
      .first();

    if (!playlist) {
      throw new AppError(404, "Playlist not found");
    }

    const deletedRows = await PlaylistItemModel.query()
      .where("playlist_id", playlistId)
      .andWhere("song_id", songId)
      .delete();

    if (deletedRows === 0) {
      throw new AppError(404, "Song not found in playlist");
    }
  }

  public async deletePlaylist({
    userId,
    playlistId,
  }: {
    userId: number;
  } & z.infer<typeof deletePlaylistSchema>) {
    const playlist = await PlaylistModel.query()
      .where("id", playlistId)
      .andWhere("owner_id", userId)
      .first();

    if (!playlist) {
      throw new AppError(404, "Playlist not found");
    }

    await PlaylistModel.query().where("id", playlistId).delete();
  }

  public async addPlaylistMember({
    userId,
    playlistId,
    memberId,
  }: {
    userId: number;
    playlistId: number;
    memberId: number;
  }) {
    const playlist = await PlaylistModel.query()
      .where("id", playlistId)
      .andWhere("owner_id", userId)
      .first();

    if (!playlist) {
      throw new AppError(404, "Playlist not found");
    }

    await PlaylistMembersModel.query().insert({
      playlist_id: playlistId,
      user_id: memberId,
    });
  }

  public async removePlaylistMember({
    userId,
    playlistId,
    memberId,
  }: {
    userId: number;
    playlistId: number;
    memberId: number;
  }) {
    const playlist = await PlaylistModel.query()
      .where("id", playlistId)
      .andWhere("owner_id", userId)
      .first();

    if (!playlist) {
      throw new AppError(404, "Playlist not found");
    }

    await PlaylistMembersModel.query()
      .where("playlist_id", playlistId)
      .andWhere("user_id", memberId)
      .delete();
  }
}
