import { describe, expect, it } from 'vitest'
import {
  getBrowserPreferredLanguage,
  LANGUAGE_STORAGE_KEY,
  readStoredLanguage,
  writeStoredLanguage,
  type LanguageStorage,
} from './language-storage.ts'
import { RANKING_STORAGE_KEY } from './ranking/storage.ts'

function createMemoryStorage(): LanguageStorage {
  const values = new Map<string, string>()

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

describe('language storage', () => {
  it('round-trips a supported language', () => {
    const storage = createMemoryStorage()

    expect(writeStoredLanguage(storage, 'de')).toBe(true)
    expect(readStoredLanguage(storage)).toBe('de')
    expect(writeStoredLanguage(storage, 'en')).toBe(true)
    expect(storage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
    expect(readStoredLanguage(storage)).toBe('en')
  })

  it('uses a key independent from the ranking session', () => {
    expect(LANGUAGE_STORAGE_KEY).not.toBe(RANKING_STORAGE_KEY)
  })

  it('falls back to English for missing or invalid values', () => {
    const storage = createMemoryStorage()

    expect(readStoredLanguage(storage)).toBe('en')

    storage.setItem(LANGUAGE_STORAGE_KEY, 'fr')
    expect(readStoredLanguage(storage)).toBe('en')
  })

  it('uses the supplied browser preference when no valid choice is stored', () => {
    const storage = createMemoryStorage()

    expect(readStoredLanguage(storage, 'de')).toBe('de')

    storage.setItem(LANGUAGE_STORAGE_KEY, 'fr')
    expect(readStoredLanguage(storage, 'de')).toBe('de')

    storage.setItem(LANGUAGE_STORAGE_KEY, 'en')
    expect(readStoredLanguage(storage, 'de')).toBe('en')
  })

  it('prefers German only for a German browser language', () => {
    expect(getBrowserPreferredLanguage('de')).toBe('de')
    expect(getBrowserPreferredLanguage('de-DE')).toBe('de')
    expect(getBrowserPreferredLanguage('DE-AT')).toBe('de')
    expect(getBrowserPreferredLanguage('en-DE')).toBe('en')
    expect(getBrowserPreferredLanguage('fr')).toBe('en')
    expect(getBrowserPreferredLanguage(undefined)).toBe('en')
  })

  it('handles unavailable storage without interrupting the app', () => {
    const unavailableStorage: LanguageStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }

    expect(readStoredLanguage(unavailableStorage)).toBe('en')
    expect(readStoredLanguage(unavailableStorage, 'de')).toBe('de')
    expect(writeStoredLanguage(unavailableStorage, 'en')).toBe(false)
  })
})
