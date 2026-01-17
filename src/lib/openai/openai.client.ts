import OpenAI from "openai";

let _client: OpenAI | null = null;

export const openAIClient = (): OpenAI => {
  if (_client) {
    return _client;
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });

  _client = client;
  return client;
};
