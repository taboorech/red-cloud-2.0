import { z as zod } from "zod";
import { AIModel } from "../constants/ai";

const generateImageSchema = zod.object({
  prompt: zod.string().min(1).max(1000),
  model: zod.enum(AIModel).default(AIModel.GPT_IMAGE_1_MINI).optional(),
});

export { generateImageSchema };
