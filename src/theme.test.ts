import { describe, expect, it } from 'vitest'
import { LANGUAGE_STORAGE_KEY } from './language-storage.ts'
import { RANKING_STORAGE_KEY } from './ranking/storage.ts'
import {
  readStoredTheme,
  THEME_STORAGE_KEY,
  writeStoredTheme,
  type ThemeStorage,
} from './theme.ts'

function createMemoryStorage(): ThemeStorage {
  const values = new Map<string, string>()

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

describe('theme storage', () => {
  it('round-trips every supported preference', () => {
    const storage = createMemoryStorage()

    for (const theme of ['system', 'light', 'dark'] as const) {
      expect(writeStoredTheme(storage, theme)).toBe(true)
      expect(readStoredTheme(storage)).toBe(theme)
    }
  })

  it('uses a key independent from other local preferences and sessions', () => {
    expect(THEME_STORAGE_KEY).not.toBe(LANGUAGE_STORAGE_KEY)
    expect(THEME_STORAGE_KEY).not.toBe(RANKING_STORAGE_KEY)
  })

  it('falls back to the system preference for missing or invalid values', () => {
    const storage = createMemoryStorage()

    expect(readStoredTheme(storage)).toBe('system')

    storage.setItem(THEME_STORAGE_KEY, 'sepia')
    expect(readStoredTheme(storage)).toBe('system')
  })

  it('handles unavailable storage without interrupting the app', () => {
    const unavailableStorage: ThemeStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }

    expect(readStoredTheme(unavailableStorage)).toBe('system')
    expect(writeStoredTheme(unavailableStorage, 'dark')).toBe(false)
  })
})
