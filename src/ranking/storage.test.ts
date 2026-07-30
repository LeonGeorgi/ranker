import { describe, expect, it } from 'vitest'
import { createRankingSession } from './session.ts'
import {
  readStoredRankingSession,
  RANKING_STORAGE_KEY,
  writeStoredRankingSession,
  type RankingStorage,
} from './storage.ts'

function createMemoryStorage(): RankingStorage {
  const values = new Map<string, string>()

  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => {
      values.delete(key)
    },
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

describe('ranking storage', () => {
  it('round-trips a valid ranking session', () => {
    const storage = createMemoryStorage()
    const session = createRankingSession(['A', 'B', 'C'], 12)

    expect(writeStoredRankingSession(storage, session)).toBe(true)
    expect(readStoredRankingSession(storage)).toEqual({ session, issue: null })
  })

  it('distinguishes corrupt data from unavailable storage', () => {
    const corruptStorage = createMemoryStorage()
    corruptStorage.setItem(RANKING_STORAGE_KEY, '{not-json')
    expect(readStoredRankingSession(corruptStorage)).toEqual({
      session: null,
      issue: 'invalid',
    })

    const unavailableStorage: RankingStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    expect(readStoredRankingSession(unavailableStorage)).toEqual({
      session: null,
      issue: 'unavailable',
    })
    expect(
      writeStoredRankingSession(
        unavailableStorage,
        createRankingSession(['A', 'B'], 1),
      ),
    ).toBe(false)
  })
})
