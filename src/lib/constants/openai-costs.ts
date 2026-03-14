import { AIModel } from "./ai";

export const costPerMillionToken = {
  [AIModel.GPT_4O_TRANSCRIBE]: {
    input: 2.5,
    output: 0,
  },
  [AIModel.GPT_IMAGE_1_MINI]: {
    input: 0,
    output: 0,
    perImage: 0.04,
  },
} as const;

export type SupportedModel = keyof typeof costPerMillionToken;
