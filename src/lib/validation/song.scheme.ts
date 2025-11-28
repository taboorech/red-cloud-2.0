import * as zod from "zod";
import { paginationValidation } from "./main.scheme";

const songIdSchema = zod.object({
  songId: zod.number().int().positive(),
});

const getSongSchema = songIdSchema;
const getSongsSchema = paginationValidation;
const createSongSchema = zod.object({
  title: zod.string().min(1).max(255),
  language: zod.string(),
  duration: zod.number().int().positive(),
  releaseYear: zod.number().int().positive().optional(),
});
const updateSongSchema = songIdSchema.extend(createSongSchema.partial().shape);
const deleteSongSchema = songIdSchema;

export {
  getSongSchema,
  getSongsSchema,
  createSongSchema,
  updateSongSchema,
  deleteSongSchema,
};
