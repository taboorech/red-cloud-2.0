import * as zod from "zod";
import { paginationValidation } from "./main.scheme";
import { songIdSchema } from "./song.scheme";

const playlistIdSchema = zod.object({
  playlistId: zod.coerce.number().int().positive(),
});

const playlistSameFieldsSchema = zod.object({
  withSongs: zod.boolean().optional().default(false),
});

const getPlaylistByIdSchema = playlistIdSchema.extend(
  playlistSameFieldsSchema.shape,
);

const getPlaylistsSchema = zod
  .object({
    withOwner: zod.boolean().optional().default(false),
  })
  .extend(paginationValidation.shape)
  .extend(playlistSameFieldsSchema.shape);
const createPlaylistSchema = zod.object({
  title: zod.string().min(1).max(255),
  isPublic: zod.boolean().optional(),
});
const updatePlaylistSchema = playlistIdSchema.extend(
  createPlaylistSchema.partial().shape,
);
const addSongToPlaylistSchema = zod
  .object({
    position: zod.number().int().nonnegative(),
  })
  .extend(playlistIdSchema.shape)
  .extend(songIdSchema.shape);
const removeSongFromPlaylistSchema = playlistIdSchema.extend(
  songIdSchema.shape,
);
const updatePlaylistOrderSchema = zod
  .object({
    songs: zod.array(
      zod.object({
        songId: songIdSchema.shape.songId,
        position: zod.number().int().nonnegative(),
      }),
    ),
  })
  .extend(playlistIdSchema.shape);
const deletePlaylistSchema = playlistIdSchema;

export {
  getPlaylistByIdSchema,
  getPlaylistsSchema,
  createPlaylistSchema,
  updatePlaylistSchema,
  addSongToPlaylistSchema,
  removeSongFromPlaylistSchema,
  updatePlaylistOrderSchema,
  deletePlaylistSchema,
};
