import { AIModel, AIProvider } from "../constants/ai";

export interface GeneratedImage {
  id: string;
  url?: string;
  b64_json?: string;
  revised_prompt?: string;
}

export interface AIGenerationResult {
  provider: AIProvider;
  images: GeneratedImage[];
  total: number;
}

export interface AIGenerationRequest {
  prompt: string;
  model?: AIModel;
}
