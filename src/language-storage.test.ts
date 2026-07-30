import { describe, expect, it } from 'vitest'
import {
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

  it('falls back to German for missing or invalid values', () => {
    const storage = createMemoryStorage()

    expect(readStoredLanguage(storage)).toBe('de')

    storage.setItem(LANGUAGE_STORAGE_KEY, 'fr')
    expect(readStoredLanguage(storage)).toBe('de')
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

    expect(readStoredLanguage(unavailableStorage)).toBe('de')
    expect(writeStoredLanguage(unavailableStorage, 'en')).toBe(false)
  })
})
