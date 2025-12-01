import * as zod from "zod";
import { paginationValidation, userIdValidation } from "./main.scheme";
import { SongAuthorsRole } from "../constants/song";

const songIdSchema = zod.object({
  songId: zod.number().int().positive(),
});

const genreSchema = zod.array(zod.number().int().positive());
const getSongsSameFieldsSchema = zod.object({
  withGenres: zod.boolean().optional().default(true),
});

const getSongSchema = getSongsSameFieldsSchema.extend(songIdSchema.shape);
const getSongsSchema = zod
  .object({
    genres: genreSchema.optional(),
  })
  .extend(getSongsSameFieldsSchema.shape)
  .extend(paginationValidation.shape);
const createSongSchema = zod.object({
  title: zod.string().min(1).max(255),
  description: zod.string().optional(),
  text: zod.string().optional(),
  language: zod.string(),
  duration: zod.number().int().positive(),
  releaseYear: zod.number().int().positive().optional(),
  isActive: zod.boolean().optional(),
  genres: genreSchema.optional(),
  authors: zod
    .array(
      zod
        .object({
          role: zod.enum(SongAuthorsRole),
        })
        .extend(userIdValidation.shape),
    )
    .optional(),
});
const toggleFavoriteSongSchema = songIdSchema;
const updateSongSchema = songIdSchema.extend(createSongSchema.partial().shape);
const deleteSongSchema = songIdSchema;
const songActionsSchema = songIdSchema;

export {
  getSongSchema,
  getSongsSchema,
  createSongSchema,
  toggleFavoriteSongSchema,
  updateSongSchema,
  deleteSongSchema,
  songActionsSchema,
};
