import * as zod from "zod";
import { paginationValidation, userIdValidation } from "./main.scheme";
import { SongAuthorsRole } from "../constants/song";
import { DeepLClient } from "../deepl/deepl.client";

const supportedLanguageCodes = DeepLClient.SUPPORTED_LANGUAGES.map(
  (lang) => lang.code,
);

const songIdSchema = zod.object({
  songId: zod.coerce.number().int().positive(),
});

const genreSchema = zod.array(zod.number().int().positive());
const getSongsSameFieldsSchema = zod.object({
  withGenres: zod.boolean().optional().default(true),
});

const getSongSchema = getSongsSameFieldsSchema.extend(songIdSchema.shape);
const getSongsSchema = zod
  .object({
    genres: genreSchema.optional(),
    owned: zod.coerce.boolean().optional(),
  })
  .extend(getSongsSameFieldsSchema.shape)
  .extend(paginationValidation.shape);
const createSongSchema = zod.object({
  title: zod.string().min(1).max(255),
  description: zod.string().optional(),
  text: zod.string().optional(),
  imageUrl: zod.url().optional(),
  language: zod
    .string()
    .refine((code) => supportedLanguageCodes.includes(code), {
      message: `Language must be one of supported DeepL codes: ${supportedLanguageCodes.join(", ")}`,
    })
    .optional(),
  duration: zod.coerce.number().int().positive(),
  releaseYear: zod.coerce.number().int().positive().optional(),
  isPublic: zod.boolean().optional(),
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
  songIdSchema,
  getSongSchema,
  getSongsSchema,
  createSongSchema,
  toggleFavoriteSongSchema,
  updateSongSchema,
  deleteSongSchema,
  songActionsSchema,
};
