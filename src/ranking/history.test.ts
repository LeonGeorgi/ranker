import { describe, expect, it } from 'vitest'
import {
  addRankingHistoryEntry,
  answerRankingQuestion,
  createCompletedRankingHistoryEntry,
  createEmptyRankingHistory,
  createRankingSession,
  deriveRankingSnapshot,
  deserializeRankingHistory,
  RANKING_HISTORY_VERSION,
  serializeRankingHistory,
  type RankingSession,
} from './index.ts'

describe('ranking history', () => {
  it('archives only completed sessions and derives their final order', () => {
    const incompleteSession = createRankingSession(['A', 'B'], 3)
    expect(
      createCompletedRankingHistoryEntry(
        incompleteSession,
        'incomplete',
        1_000,
      ),
    ).toBeNull()

    const completedSession = completeTwoItemSession(['A', 'B'], 3)
    const entry = createCompletedRankingHistoryEntry(
      completedSession,
      'completed',
      1_000,
    )

    expect(entry).toEqual({
      id: 'completed',
      savedAt: 1_000,
      session: completedSession,
    })
    expect(
      entry === null
        ? null
        : deriveRankingSnapshot(entry.session).finalRanking?.map(
            (item) => item.label,
          ),
    ).toEqual(
      deriveRankingSnapshot(completedSession).finalRanking?.map(
        (item) => item.label,
      ),
    )
  })

  it('prepends new entries and ignores the same entry twice', () => {
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
        id: 'same-session-after-reload',
      }),
    ).toBe(withSecond)
  })

  it('round-trips a valid versioned history', () => {
    const entry = requireHistoryEntry(
      completeTwoItemSession(['A', 'B'], 7),
      'entry-1',
      5_000,
    )
    const history = addRankingHistoryEntry(
      createEmptyRankingHistory(),
      entry,
    )

    expect(deserializeRankingHistory(serializeRankingHistory(history))).toEqual(
      history,
    )
  })

  it('rejects incompatible or corrupt history entries', () => {
    const completedSession = completeTwoItemSession(['A', 'B'], 4)
    const incompleteSession = createRankingSession(['A', 'B'], 4)
    const validEntry = {
      id: 'entry-1',
      savedAt: 1_000,
      session: completedSession,
    }

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
          entries: [{ ...validEntry, session: incompleteSession }],
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
) {
  const entry = createCompletedRankingHistoryEntry(session, id, savedAt)
  if (entry === null) {
    throw new Error('Expected a completed ranking history entry.')
  }

  return entry
}
