import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private readonly rapidApiKey: string;
  private readonly rapidApiHost: string;
  private readonly rapidApiUrl: string;

  constructor(private configService: ConfigService) {
    this.rapidApiKey =
      this.configService.get<string>('rapidapi.key') ||
      '0068951b68msh9bbeef05b91ae64p1db142jsnd56da51f1fe7';
    this.rapidApiHost =
      this.configService.get<string>('rapidapi.host') ||
      'deep-translate1.p.rapidapi.com';
    this.rapidApiUrl =
      this.configService.get<string>('rapidapi.url') ||
      'https://deep-translate1.p.rapidapi.com/language/translate/v2';
  }

  /**
   * Translates text from source language to target language using RapidAPI
   */
  async translateText(
    text: string,
    sourceLanguage: string = 'en',
    targetLanguage: string,
  ): Promise<string> {
    try {
      const response = await axios.post(
        this.rapidApiUrl,
        {
          q: text,
          source: sourceLanguage,
          target: targetLanguage,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': this.rapidApiHost,
            'x-rapidapi-key': this.rapidApiKey,
          },
        },
      );

      const translatedText =
        response.data?.data?.translations?.translatedText[0];

      if (!translatedText) {
        throw new Error('Translation failed or empty response received');
      }

      return translatedText;
    } catch (error) {
      this.logger.error(`Translation failed: ${error.message}`, error.stack);
      return text; // Return original text if translation fails
    }
  }

  /**
   * Maps our language codes to RapidAPI language codes
   */
  getTargetLanguageCode(parentLanguage: string): string {
    const languageMap = {
      english: 'en',
      hindi: 'hi',
      marathi: 'mr',
      tamil: 'ta',
      telugu: 'te',
      kannada: 'kn',
      malayalam: 'ml',
      gujarati: 'gu',
      bengali: 'bn',
      punjabi: 'pa',
      urdu: 'ur',
      odia: 'or',
    };

    return languageMap[parentLanguage.toLowerCase()] || 'en';
  }
}
