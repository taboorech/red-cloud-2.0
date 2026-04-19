import { z as zod } from "zod";
import { paginationValidation } from "./main.scheme";

const getRecommendationsSchema = zod
  .object({
    strategy: zod
      .enum(["genre", "social", "content", "mixed"])
      .optional()
      .default("mixed"),
  })
  .extend(paginationValidation.shape);

const generateSongEmbeddingSchema = zod.object({
  songId: zod.coerce.number().int().positive(),
});

export { getRecommendationsSchema, generateSongEmbeddingSchema };
