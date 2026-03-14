import { z as zod } from "zod";
import { AIModel } from "../constants/ai";
import { ContentType } from "../db/models/user-activity.model";
import { paginationValidation, userIdValidation } from "./main.scheme";

const generateImageSchema = zod.object({
  prompt: zod.string().min(1).max(1000),
  model: zod.enum(AIModel).default(AIModel.GPT_IMAGE_1_MINI).optional(),
});

const generateLyricsWithAudioFileSchema = zod
  .object({
    audioFile: zod.string().min(1, "Audio file path is required").optional(),
    songId: zod
      .number()
      .int()
      .positive("Song ID must be a positive integer")
      .optional(),
    model: zod.enum(AIModel).default(AIModel.GPT_4O_TRANSCRIBE).optional(),
  })
  .refine((data) => data.audioFile || data.songId, {
    message: "Either audioFile or songId must be provided",
  });

const getUserActivityQuerySchema = zod.object({
  contentType: zod.enum(ContentType).optional(),
  startDate: zod.string().optional(),
  endDate: zod.string().optional(),
}).extend(paginationValidation.shape).extend(userIdValidation.shape);

export { 
  generateImageSchema, 
  generateLyricsWithAudioFileSchema, 
  getUserActivityQuerySchema 
};
