import i18next from 'i18next';

interface ITranslationService {
  translate(key: string, options?: Record<string, any>): string;
  setLanguage(language: string): void;
}

export class TranslationService implements ITranslationService {
  constructor() {
    i18next.init({
      lng: 'en',
      resources: {
        en: {
          translation: {},
        },
        fr: {
          translation: {},
        },
      },
    });
  }

  translate(key: string, options?: Record<string, any>): string {
    return i18next.t(key, options);
  }

  setLanguage(language: string): void {
    i18next.changeLanguage(language);
  }
}

export function t(toTranslate: string) {
  return toTranslate;
}
