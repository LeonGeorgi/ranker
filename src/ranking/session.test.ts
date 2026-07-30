import { describe, expect, it } from 'vitest'
import {
  answerRankingQuestion,
  buildRankingGraph,
  createRandomState,
  createRankingSession,
  deriveRankingSnapshot,
  deserializeRankingSession,
  getExpectedDecisionCount,
  getMaximumDecisionCount,
  getUniqueRanking,
  nextRandom,
  RankingSessionError,
  serializeRankingSession,
  undoLastRankingDecision,
  type RankingItem,
  type RankingQuestion,
  type RankingSession,
  type RankingSnapshot,
} from './index.ts'

describe('ranking comparison counts', () => {
  it('calculates the exact expected count for a balanced merge ranking', () => {
    expect(getExpectedDecisionCount(0)).toBe(0)
    expect(getExpectedDecisionCount(1)).toBe(0)
    expect(getExpectedDecisionCount(2)).toBe(1)
    expect(getExpectedDecisionCount(5)).toBeCloseTo(43 / 6, 12)
    expect(getExpectedDecisionCount(10)).toBeCloseTo(68 / 3, 12)
    expect(getExpectedDecisionCount(50)).toBeCloseTo(605_789 / 2_730, 12)
  })

  it('stays within the merge comparison bound for supported list sizes', () => {
    for (let itemCount = 2; itemCount <= 50; itemCount += 1) {
      expect(getExpectedDecisionCount(itemCount)).toBeLessThanOrEqual(
        getMaximumDecisionCount(itemCount),
      )
    }
  })

  it('rejects invalid item counts', () => {
    expect(() => getExpectedDecisionCount(-1)).toThrowError(TypeError)
    expect(() => getExpectedDecisionCount(2.5)).toThrowError(TypeError)
  })
})

describe('ranking sessions', () => {
  it('ranks two items with one comparison and a winner-pointing edge', () => {
    const initialSession = createRankingSession(['Marzipan', 'Lakritz'], 17)
    const initialSnapshot = deriveRankingSnapshot(initialSession)
    const question = requireQuestion(initialSnapshot)

    expect(question.kind).toBe('discovery-pair')
    expect(question.introducedItemIds).toHaveLength(2)
    expect(initialSnapshot.graph.nodes).toHaveLength(0)

    const completedSession = answerRankingQuestion(
      initialSession,
      question.right.id,
      question.id,
    )
    const completedSnapshot = deriveRankingSnapshot(completedSession)

    expect(completedSnapshot.progress).toMatchObject({
      decisionCount: 1,
      visibleItemCount: 2,
      determinedPairCount: 1,
      totalPairCount: 1,
      isComplete: true,
    })
    expect(completedSnapshot.graph.edges).toEqual([
      expect.objectContaining({
        sourceItemId: question.left.id,
        targetItemId: question.right.id,
        isLatest: true,
      }),
    ])
    expect(completedSnapshot.finalRanking?.map((item) => item.id)).toEqual([
      question.right.id,
      question.left.id,
    ])
  })

  it('handles an odd item count with a balanced merge tree', () => {
    const labels = ['A', 'B', 'C', 'D', 'E']
    const { session, snapshot } = completeByLabelOrder(labels, 23)

    expect(session.decisions.length).toBeLessThanOrEqual(
      getMaximumDecisionCount(labels.length),
    )
    expect(snapshot.finalRanking?.map((item) => item.label)).toEqual(labels)
    expect(snapshot.progress.visibleItemCount).toBe(labels.length)
    expect(snapshot.progress.determinedFraction).toBe(1)
  })

  it('interleaves discovery and merge work while ranking 30 items', () => {
    const labels = Array.from({ length: 30 }, (_, index) => `Item ${index + 1}`)
    let session = createRankingSession(labels, 42)
    let sawEarlyMerge = false

    while (true) {
      const snapshot = deriveRankingSnapshot(session)
      if (snapshot.progress.isComplete) {
        expect(snapshot.finalRanking?.map((item) => item.label)).toEqual(labels)
        expect(session.decisions.length).toBeLessThanOrEqual(119)
        break
      }

      const question = requireQuestion(snapshot)
      if (
        question.kind === 'merge' &&
        snapshot.progress.visibleItemCount < labels.length
      ) {
        sawEarlyMerge = true
      }

      const preferredItem = preferEarlierLabel(question, labels)
      session = answerRankingQuestion(session, preferredItem.id, question.id)
    }

    expect(sawEarlyMerge).toBe(true)
  })

  it('reconstructs the same current question and graph after serialization', () => {
    const labels = Array.from({ length: 11 }, (_, index) => `Item ${index + 1}`)
    let session = createRankingSession(labels, 1_234)

    for (let decisionIndex = 0; decisionIndex < 12; decisionIndex += 1) {
      const question = requireQuestion(deriveRankingSnapshot(session))
      const preferredItem = preferEarlierLabel(question, labels)
      session = answerRankingQuestion(session, preferredItem.id, question.id)
    }

    const restoredSession = deserializeRankingSession(
      serializeRankingSession(session),
    )
    expect(restoredSession).not.toBeNull()
    if (restoredSession === null) {
      throw new Error('Expected the serialized session to be restored.')
    }

    expect(restoredSession).toEqual(session)
    expect(deriveRankingSnapshot(restoredSession)).toEqual(
      deriveRankingSnapshot(session),
    )
  })

  it('produces the same schedule from the same seed and decisions', () => {
    const labels = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`)
    let firstSession = createRankingSession(labels, 987)
    let secondSession = createRankingSession(labels, 987)

    for (let decisionIndex = 0; decisionIndex < 20; decisionIndex += 1) {
      const firstQuestion = requireQuestion(
        deriveRankingSnapshot(firstSession),
      )
      const secondQuestion = requireQuestion(
        deriveRankingSnapshot(secondSession),
      )
      expect(secondQuestion).toEqual(firstQuestion)

      firstSession = answerRankingQuestion(
        firstSession,
        firstQuestion.left.id,
        firstQuestion.id,
      )
      secondSession = answerRankingQuestion(
        secondSession,
        secondQuestion.left.id,
        secondQuestion.id,
      )
    }

    expect(secondSession).toEqual(firstSession)
  })

  it('restores the exact prior question and graph when undoing', () => {
    const initialSession = createRankingSession(['A', 'B', 'C', 'D', 'E'], 71)
    const initialSnapshot = deriveRankingSnapshot(initialSession)
    const initialQuestion = requireQuestion(initialSnapshot)
    const onceAnswered = answerRankingQuestion(
      initialSession,
      initialQuestion.left.id,
      initialQuestion.id,
    )
    const onceAnsweredSnapshot = deriveRankingSnapshot(onceAnswered)
    const secondQuestion = requireQuestion(onceAnsweredSnapshot)
    const twiceAnswered = answerRankingQuestion(
      onceAnswered,
      secondQuestion.right.id,
      secondQuestion.id,
    )

    const undoneOnce = undoLastRankingDecision(twiceAnswered)
    expect(undoneOnce).toEqual(onceAnswered)
    expect(deriveRankingSnapshot(undoneOnce)).toEqual(onceAnsweredSnapshot)

    const undoneTwice = undoLastRankingDecision(undoneOnce)
    expect(deriveRankingSnapshot(undoneTwice)).toEqual(initialSnapshot)
    expect(undoLastRankingDecision(undoneTwice)).toBe(undoneTwice)
  })

  it('rejects invalid choices and stale question ids', () => {
    const session = createRankingSession(['A', 'B', 'C'], 5)
    const question = requireQuestion(deriveRankingSnapshot(session))

    expect(() =>
      answerRankingQuestion(session, 'unknown-item', question.id),
    ).toThrowError(
      expect.objectContaining<Partial<RankingSessionError>>({
        code: 'invalid-choice',
      }),
    )

    const answeredSession = answerRankingQuestion(
      session,
      question.left.id,
      question.id,
    )
    const nextQuestion = requireQuestion(deriveRankingSnapshot(answeredSession))

    expect(() =>
      answerRankingQuestion(
        answeredSession,
        nextQuestion.left.id,
        question.id,
      ),
    ).toThrowError(
      expect.objectContaining<Partial<RankingSessionError>>({
        code: 'stale-question',
      }),
    )
  })

  it('normalizes valid input and rejects invalid item lists', () => {
    const session = createRankingSession(['  Schokolade ', '', ' Lakritz'], 2)
    expect(session.items.map((item) => item.label)).toEqual([
      'Schokolade',
      'Lakritz',
    ])

    expect(() => createRankingSession(['A', ' a '], 2)).toThrowError(
      expect.objectContaining<Partial<RankingSessionError>>({
        code: 'invalid-items',
      }),
    )
    expect(() => createRankingSession(['A', '  '], 2)).toThrowError(
      RankingSessionError,
    )
    expect(() =>
      createRankingSession(
        Array.from({ length: 51 }, (_, index) => `Item ${index}`),
        2,
      ),
    ).toThrowError(RankingSessionError)
    expect(() => createRankingSession(['A', 'B'], 1.5)).toThrowError(TypeError)
  })

  it('rejects corrupt or incompatible persisted sessions', () => {
    const session = createRankingSession(['A', 'B', 'C'], 9)
    const question = requireQuestion(deriveRankingSnapshot(session))
    const answeredSession = answerRankingQuestion(
      session,
      question.left.id,
      question.id,
    )

    expect(deserializeRankingSession('not json')).toBeNull()
    expect(
      deserializeRankingSession(
        JSON.stringify({ ...answeredSession, version: 2 }),
      ),
    ).toBeNull()
    expect(
      deserializeRankingSession(
        JSON.stringify({
          ...answeredSession,
          decisions: [
            { betterItemId: 'unknown', worseItemId: question.right.id },
          ],
        }),
      ),
    ).toBeNull()
    expect(
      deserializeRankingSession(
        JSON.stringify({
          ...answeredSession,
          decisions: [
            { betterItemId: question.left.id, worseItemId: question.right.id },
            { betterItemId: question.left.id, worseItemId: question.right.id },
          ],
        }),
      ),
    ).toBeNull()
  })
})

describe('ranking graph', () => {
  const items: readonly RankingItem[] = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
  ]

  it('returns a ranking only when the graph has one topological order', () => {
    expect(
      getUniqueRanking(items, [{ betterItemId: 'a', worseItemId: 'b' }]),
    ).toBeNull()
    expect(
      getUniqueRanking(items, [
        { betterItemId: 'a', worseItemId: 'b' },
        { betterItemId: 'b', worseItemId: 'c' },
      ])?.map((item) => item.id),
    ).toEqual(['a', 'b', 'c'])
  })

  it('keeps every actual comparison and points each edge to its winner', () => {
    const graph = buildRankingGraph(items, [
      { betterItemId: 'a', worseItemId: 'b' },
      { betterItemId: 'a', worseItemId: 'c' },
    ])

    expect(graph.nodes).toHaveLength(3)
    expect(graph.edges).toEqual([
      expect.objectContaining({
        sourceItemId: 'b',
        targetItemId: 'a',
        isLatest: false,
      }),
      expect.objectContaining({
        sourceItemId: 'c',
        targetItemId: 'a',
        isLatest: true,
      }),
    ])
  })
})

describe('deterministic random state', () => {
  it('continues from a JSON-serializable uint32 state', () => {
    const firstSample = nextRandom(createRandomState(123))
    const resumedState = { value: firstSample.state.value }

    expect(nextRandom(resumedState)).toEqual(nextRandom(firstSample.state))
  })
})

function completeByLabelOrder(
  labels: readonly string[],
  seed: number,
): { readonly session: RankingSession; readonly snapshot: RankingSnapshot } {
  let session = createRankingSession(labels, seed)

  while (true) {
    const snapshot = deriveRankingSnapshot(session)
    if (snapshot.progress.isComplete) {
      return { session, snapshot }
    }

    const question = requireQuestion(snapshot)
    const preferredItem = preferEarlierLabel(question, labels)
    session = answerRankingQuestion(session, preferredItem.id, question.id)
  }
}

function preferEarlierLabel(
  question: RankingQuestion,
  labels: readonly string[],
): RankingItem {
  const leftRank = labels.indexOf(question.left.label)
  const rightRank = labels.indexOf(question.right.label)
  if (leftRank === -1 || rightRank === -1) {
    throw new Error('A comparison contains an unknown test item.')
  }

  return leftRank < rightRank ? question.left : question.right
}

function requireQuestion(snapshot: RankingSnapshot): RankingQuestion {
  if (snapshot.currentQuestion === null) {
    throw new Error('Expected a current ranking question.')
  }
  return snapshot.currentQuestion
}
