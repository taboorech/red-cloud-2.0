import { z as zod } from "zod";
import { DeepLClient } from "../deepl/deepl.client";

const supportedLanguageCodes = DeepLClient.SUPPORTED_LANGUAGES.map((lang) =>
  lang.code.toLowerCase(),
);

const songIdSchema = zod.object({
  songId: zod.coerce.number().int().positive(),
});

const getSongLyricsSchema = songIdSchema;

const translateSongLyricsSchema = zod
  .object({
    targetLanguage: zod
      .string()
      .refine((code) => supportedLanguageCodes.includes(code.toLowerCase()), {
        message: `Target language must be one of: ${supportedLanguageCodes.join(
          ", ",
        )}`,
      }),
  })
  .extend(songIdSchema.shape);

export { getSongLyricsSchema, translateSongLyricsSchema };
