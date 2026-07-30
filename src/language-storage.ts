import {
  DEFAULT_LANGUAGE,
  type Language,
} from './i18n.ts'

export const LANGUAGE_STORAGE_KEY = 'ranker.language'

export interface LanguageStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function readStoredLanguage(storage: LanguageStorage): Language {
  try {
    const language = storage.getItem(LANGUAGE_STORAGE_KEY)
    return language === 'de' || language === 'en'
      ? language
      : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export function writeStoredLanguage(
  storage: LanguageStorage,
  language: Language,
): boolean {
  try {
    storage.setItem(LANGUAGE_STORAGE_KEY, language)
    return true
  } catch {
    return false
  }
}
