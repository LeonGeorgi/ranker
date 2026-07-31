import { describe, expect, it } from 'vitest'
import {
  addRankingHistoryEntry,
  answerRankingQuestion,
  createCompletedRankingHistoryEntry,
  createEmptyRankingHistory,
  createRankingSession,
  deriveRankingSnapshot,
  deserializeRankingHistory,
  MAX_RANKING_HISTORY_ENTRIES,
  RANKING_HISTORY_VERSION,
  serializeRankingHistory,
  type RankingHistoryEntry,
  type RankingSession,
} from './index.ts'

describe('ranking history', () => {
  it('archives only completed sessions as stable result snapshots', () => {
    const incompleteSession = createRankingSession(['A', 'B'], 3)
    expect(
      createCompletedRankingHistoryEntry(
        incompleteSession,
        'incomplete',
        1_000,
      ),
    ).toBeNull()

    const completedSession = completeTwoItemSession(['A', 'B'], 3)
    const completedRanking = deriveRankingSnapshot(
      completedSession,
    ).finalRanking?.map((item) => item.label)
    const entry = createCompletedRankingHistoryEntry(
      completedSession,
      'completed',
      1_000,
    )

    expect(entry).toEqual({
      id: 'completed',
      savedAt: 1_000,
      ranking: completedRanking,
      decisionCount: completedSession.decisions.length,
    })
    expect(entry).not.toHaveProperty('session')
  })

  it('prepends entries, ignores duplicate snapshots, and keeps the newest 50', () => {
    const firstEntry = requireHistoryEntry(
      completeTwoItemSession(['A', 'B'], 1),
      'first',
      1_000,
    )
    const secondEntry = requireHistoryEntry(
      completeTwoItemSession(['C', 'D'], 2),
      'second',
      2_000,
    )

    const withFirst = addRankingHistoryEntry(
      createEmptyRankingHistory(),
      firstEntry,
    )
    const withSecond = addRankingHistoryEntry(withFirst, secondEntry)

    expect(withSecond.entries.map((entry) => entry.id)).toEqual([
      'second',
      'first',
    ])
    expect(addRankingHistoryEntry(withSecond, secondEntry)).toBe(withSecond)
    expect(
      addRankingHistoryEntry(withSecond, {
        ...firstEntry,
        id: 'same-snapshot-after-reload',
        savedAt: 9_000,
      }),
    ).toBe(withSecond)

    let cappedHistory = createEmptyRankingHistory()
    for (let index = 0; index <= MAX_RANKING_HISTORY_ENTRIES; index += 1) {
      cappedHistory = addRankingHistoryEntry(
        cappedHistory,
        createSnapshotEntry(index),
      )
    }

    expect(cappedHistory.entries).toHaveLength(MAX_RANKING_HISTORY_ENTRIES)
    expect(cappedHistory.entries[0]?.id).toBe(
      `entry-${MAX_RANKING_HISTORY_ENTRIES}`,
    )
    expect(cappedHistory.entries.some((entry) => entry.id === 'entry-0')).toBe(
      false,
    )
  })

  it('round-trips v2 without persisting sessions or replay state', () => {
    const entry = requireHistoryEntry(
      completeTwoItemSession(['A', 'B'], 7),
      'entry-1',
      5_000,
    )
    const history = addRankingHistoryEntry(
      createEmptyRankingHistory(),
      entry,
    )
    const serializedHistory = serializeRankingHistory(history)

    expect(deserializeRankingHistory(serializedHistory)).toEqual(history)
    expect(JSON.parse(serializedHistory)).toEqual({
      version: RANKING_HISTORY_VERSION,
      entries: [entry],
    })
    expect(serializedHistory).not.toContain('"session"')
    expect(serializedHistory).not.toContain('"decisions"')
    expect(serializedHistory).not.toContain('"seed"')
  })

  it('migrates completed v1 session entries and limits legacy history', () => {
    const completedSession = completeTwoItemSession(['A', 'B'], 4)
    const expectedRanking = deriveRankingSnapshot(
      completedSession,
    ).finalRanking?.map((item) => item.label)
    const legacyEntries = Array.from(
      { length: MAX_RANKING_HISTORY_ENTRIES + 1 },
      (_, index) => ({
        id: `legacy-${index}`,
        savedAt: index,
        session: completedSession,
      }),
    )

    const migratedHistory = deserializeRankingHistory(
      JSON.stringify({ version: 1, entries: legacyEntries }),
    )

    expect(migratedHistory?.version).toBe(RANKING_HISTORY_VERSION)
    expect(migratedHistory?.entries).toHaveLength(MAX_RANKING_HISTORY_ENTRIES)
    expect(migratedHistory?.entries[0]).toEqual({
      id: 'legacy-0',
      savedAt: 0,
      ranking: expectedRanking,
      decisionCount: completedSession.decisions.length,
    })
    expect(migratedHistory?.entries.at(-1)?.id).toBe(
      `legacy-${MAX_RANKING_HISTORY_ENTRIES - 1}`,
    )
  })

  it('rejects incompatible or corrupt v2 and v1 histories', () => {
    const completedSession = completeTwoItemSession(['A', 'B'], 4)
    const incompleteSession = createRankingSession(['A', 'B'], 4)
    const validEntry = requireHistoryEntry(
      completedSession,
      'entry-1',
      1_000,
    )

    expect(deserializeRankingHistory('not json')).toBeNull()
    expect(
      deserializeRankingHistory(
        JSON.stringify({
          version: RANKING_HISTORY_VERSION + 1,
          entries: [],
        }),
      ),
    ).toBeNull()
    expect(
      deserializeRankingHistory(
        JSON.stringify({
          version: RANKING_HISTORY_VERSION,
          entries: [{ ...validEntry, savedAt: -1 }],
        }),
      ),
    ).toBeNull()
    expect(
      deserializeRankingHistory(
        JSON.stringify({
          version: RANKING_HISTORY_VERSION,
          entries: [{ ...validEntry, savedAt: 8_640_000_000_000_001 }],
        }),
      ),
    ).toBeNull()
    expect(
      deserializeRankingHistory(
        JSON.stringify({
          version: RANKING_HISTORY_VERSION,
          entries: [{ ...validEntry, ranking: ['A'] }],
        }),
      ),
    ).toBeNull()
    expect(
      deserializeRankingHistory(
        JSON.stringify({
          version: RANKING_HISTORY_VERSION,
          entries: [{ ...validEntry, ranking: ['A', 'a'] }],
        }),
      ),
    ).toBeNull()
    expect(
      deserializeRankingHistory(
        JSON.stringify({
          version: RANKING_HISTORY_VERSION,
          entries: [{ ...validEntry, decisionCount: 0 }],
        }),
      ),
    ).toBeNull()
    expect(
      deserializeRankingHistory(
        JSON.stringify({
          version: RANKING_HISTORY_VERSION,
          entries: [{ ...validEntry, decisionCount: 2 }],
        }),
      ),
    ).toBeNull()
    expect(
      deserializeRankingHistory(
        JSON.stringify({
          version: RANKING_HISTORY_VERSION,
          entries: [validEntry, validEntry],
        }),
      ),
    ).toBeNull()
    expect(
      deserializeRankingHistory(
        JSON.stringify({
          version: RANKING_HISTORY_VERSION,
          entries: Array.from(
            { length: MAX_RANKING_HISTORY_ENTRIES + 1 },
            (_, index) => createSnapshotEntry(index),
          ),
        }),
      ),
    ).toBeNull()
    expect(
      deserializeRankingHistory(
        JSON.stringify({
          version: 1,
          entries: [
            {
              id: 'incomplete',
              savedAt: 1_000,
              session: incompleteSession,
            },
          ],
        }),
      ),
    ).toBeNull()
  })
})

function completeTwoItemSession(
  labels: readonly [string, string],
  seed: number,
): RankingSession {
  const session = createRankingSession(labels, seed)
  const question = deriveRankingSnapshot(session).currentQuestion
  if (question === null) {
    throw new Error('Expected a comparison for a two-item ranking.')
  }

  return answerRankingQuestion(session, question.left.id, question.id)
}

function requireHistoryEntry(
  session: RankingSession,
  id: string,
  savedAt: number,
): RankingHistoryEntry {
  const entry = createCompletedRankingHistoryEntry(session, id, savedAt)
  if (entry === null) {
    throw new Error('Expected a completed ranking history entry.')
  }

  return entry
}

function createSnapshotEntry(index: number): RankingHistoryEntry {
  return {
    id: `entry-${index}`,
    savedAt: index,
    ranking: [`Better ${index}`, `Worse ${index}`],
    decisionCount: 1,
  }
}
