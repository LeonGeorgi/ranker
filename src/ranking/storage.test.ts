import { describe, expect, it } from 'vitest'
import {
  answerRankingQuestion,
  createRankingSession,
  deriveRankingSnapshot,
} from './session.ts'
import {
  addRankingHistoryEntry,
  createCompletedRankingHistoryEntry,
  createEmptyRankingHistory,
} from './history.ts'
import {
  clearStoredRankingSession,
  LEGACY_RANKING_HISTORY_STORAGE_KEY,
  readStoredRankingHistory,
  readStoredRankingSession,
  RANKING_HISTORY_STORAGE_KEY,
  RANKING_STORAGE_KEY,
  writeStoredRankingHistory,
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

  it('round-trips completed ranking history independently of the active session', () => {
    const storage = createMemoryStorage()
    const activeSession = createRankingSession(['Current A', 'Current B'], 10)
    const completedSession = completeTwoItemSession(['Past A', 'Past B'], 11)
    const entry = createCompletedRankingHistoryEntry(
      completedSession,
      'past-ranking',
      1_000,
    )
    if (entry === null) {
      throw new Error('Expected a completed ranking history entry.')
    }
    const history = addRankingHistoryEntry(
      createEmptyRankingHistory(),
      entry,
    )

    expect(writeStoredRankingSession(storage, activeSession)).toBe(true)
    expect(writeStoredRankingHistory(storage, history)).toBe(true)
    expect(readStoredRankingSession(storage)).toEqual({
      session: activeSession,
      issue: null,
    })
    expect(readStoredRankingHistory(storage)).toEqual({
      history,
      issue: null,
    })

    expect(clearStoredRankingSession(storage)).toBe(true)
    expect(storage.getItem(RANKING_STORAGE_KEY)).toBeNull()
    expect(storage.getItem(RANKING_HISTORY_STORAGE_KEY)).not.toBeNull()
    expect(readStoredRankingHistory(storage)).toEqual({
      history,
      issue: null,
    })
  })

  it('migrates v1 history to the v2 key without deleting the legacy value', () => {
    const storage = createMemoryStorage()
    const completedSession = completeTwoItemSession(['Past A', 'Past B'], 12)
    const serializedLegacyHistory = JSON.stringify({
      version: 1,
      entries: [
        {
          id: 'legacy-ranking',
          savedAt: 3_000,
          session: completedSession,
        },
      ],
    })
    storage.setItem(
      LEGACY_RANKING_HISTORY_STORAGE_KEY,
      serializedLegacyHistory,
    )

    const result = readStoredRankingHistory(storage)

    expect(result).toEqual({
      history: {
        version: 2,
        entries: [
          {
            id: 'legacy-ranking',
            savedAt: 3_000,
            ranking: deriveRankingSnapshot(
              completedSession,
            ).finalRanking?.map((item) => item.label),
            decisionCount: completedSession.decisions.length,
          },
        ],
      },
      issue: null,
    })
    expect(storage.getItem(LEGACY_RANKING_HISTORY_STORAGE_KEY)).toBe(
      serializedLegacyHistory,
    )
    expect(storage.getItem(RANKING_HISTORY_STORAGE_KEY)).toBe(
      JSON.stringify(result.history),
    )
  })

  it('returns migrated v1 data when writing the v2 copy fails', () => {
    const storage = createMemoryStorage()
    const completedSession = completeTwoItemSession(['A', 'B'], 13)
    const serializedLegacyHistory = JSON.stringify({
      version: 1,
      entries: [
        {
          id: 'legacy-ranking',
          savedAt: 4_000,
          session: completedSession,
        },
      ],
    })
    storage.setItem(
      LEGACY_RANKING_HISTORY_STORAGE_KEY,
      serializedLegacyHistory,
    )
    const failingMigrationStorage: RankingStorage = {
      getItem: (key) => storage.getItem(key),
      removeItem: (key) => storage.removeItem(key),
      setItem: () => {
        throw new Error('quota exceeded')
      },
    }

    const result = readStoredRankingHistory(failingMigrationStorage)

    expect(result.issue).toBe('unavailable')
    expect(result.history.entries).toHaveLength(1)
    expect(result.history.entries[0]?.ranking).toEqual(
      deriveRankingSnapshot(completedSession).finalRanking?.map(
        (item) => item.label,
      ),
    )
    expect(storage.getItem(LEGACY_RANKING_HISTORY_STORAGE_KEY)).toBe(
      serializedLegacyHistory,
    )
    expect(storage.getItem(RANKING_HISTORY_STORAGE_KEY)).toBeNull()
  })

  it('returns an empty history when none has been stored', () => {
    expect(readStoredRankingHistory(createMemoryStorage())).toEqual({
      history: createEmptyRankingHistory(),
      issue: null,
    })
  })

  it('distinguishes corrupt history from unavailable storage', () => {
    const corruptStorage = createMemoryStorage()
    corruptStorage.setItem(RANKING_HISTORY_STORAGE_KEY, '{not-json')
    expect(readStoredRankingHistory(corruptStorage)).toEqual({
      history: createEmptyRankingHistory(),
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
    expect(readStoredRankingHistory(unavailableStorage)).toEqual({
      history: createEmptyRankingHistory(),
      issue: 'unavailable',
    })
    expect(
      writeStoredRankingHistory(
        unavailableStorage,
        createEmptyRankingHistory(),
      ),
    ).toBe(false)
  })

  it('keeps the previous history when a replacement write fails', () => {
    const storage = createMemoryStorage()
    const completedSession = completeTwoItemSession(['A', 'B'], 20)
    const entry = createCompletedRankingHistoryEntry(
      completedSession,
      'existing-ranking',
      2_000,
    )
    if (entry === null) {
      throw new Error('Expected a completed ranking history entry.')
    }
    const history = addRankingHistoryEntry(
      createEmptyRankingHistory(),
      entry,
    )
    expect(writeStoredRankingHistory(storage, history)).toBe(true)

    const failingWriteStorage: RankingStorage = {
      getItem: (key) => storage.getItem(key),
      removeItem: (key) => storage.removeItem(key),
      setItem: () => {
        throw new Error('quota exceeded')
      },
    }
    expect(
      writeStoredRankingHistory(
        failingWriteStorage,
        createEmptyRankingHistory(),
      ),
    ).toBe(false)
    expect(readStoredRankingHistory(storage)).toEqual({
      history,
      issue: null,
    })
  })
})

function completeTwoItemSession(
  labels: readonly [string, string],
  seed: number,
) {
  const session = createRankingSession(labels, seed)
  const question = deriveRankingSnapshot(session).currentQuestion
  if (question === null) {
    throw new Error('Expected a comparison for a two-item ranking.')
  }

  return answerRankingQuestion(session, question.left.id, question.id)
}
