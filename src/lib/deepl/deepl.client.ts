import * as deepl from "deepl-node";
import { injectable } from "inversify";
import { AppError } from "../errors/app.error";

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

@injectable()
export class DeepLClient {
  private translator: deepl.Translator;

  public static readonly SUPPORTED_LANGUAGES: LanguageOption[] = [
    { code: "EN", name: "English", flag: "🇬🇧" },
    { code: "UK", name: "Українська", flag: "🇺🇦" },
    { code: "ES", name: "Español", flag: "🇪🇸" },
    { code: "FR", name: "Français", flag: "🇫🇷" },
    { code: "DE", name: "Deutsch", flag: "🇩🇪" },
    { code: "IT", name: "Italiano", flag: "🇮🇹" },
    { code: "PL", name: "Polski", flag: "🇵🇱" },
    { code: "PT", name: "Português", flag: "🇵🇹" },
  ];

  constructor() {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      throw new AppError(
        500,
        "DEEPL_API_KEY is not set in environment variables",
      );
    }
    this.translator = new deepl.Translator(apiKey);
  }

  public async translateText(
    text: string,
    targetLang: string,
    sourceLang?: string,
  ): Promise<{ translatedText: string; detectedSourceLang?: string }> {
    try {
      if (!text?.trim()) {
        throw new AppError(400, "Text cannot be empty");
      }

      if (text.length > 8000) {
        throw new AppError(400, "Text is too long (max 8000 characters)");
      }

      const isTargetSupported = DeepLClient.SUPPORTED_LANGUAGES.some(
        (lang) => lang.code.toLowerCase() === targetLang.toLowerCase(),
      );

      if (!isTargetSupported) {
        throw new AppError(400, `Unsupported target language: ${targetLang}`);
      }

      let sourceCode: string | null = null;
      if (sourceLang) {
        const isSourceSupported = DeepLClient.SUPPORTED_LANGUAGES.some(
          (lang) => lang.code.toLowerCase() === sourceLang.toLowerCase(),
        );
        if (isSourceSupported) {
          sourceCode = sourceLang.toUpperCase();
        }
      }

      const result = await this.translator.translateText(
        text,
        (sourceCode as deepl.SourceLanguageCode) || null,
        targetLang as deepl.TargetLanguageCode,
      );

      return {
        translatedText: result.text,
        detectedSourceLang: result.detectedSourceLang,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error.message?.includes("quota")) {
        throw new AppError(456, "DeepL API quota exceeded");
      }
      if (error.message?.includes("auth")) {
        throw new AppError(403, "DeepL API authentication failed");
      }
      throw new AppError(500, `Translation failed: ${error.message}`);
    }
  }

  public getSupportedLanguages(): LanguageOption[] {
    return DeepLClient.SUPPORTED_LANGUAGES;
  }
}
