import { describe, expect, it } from 'vitest'
import { analyzeRankingInput } from './ranking/input.ts'
import {
  pickRankingExampleIds,
  RANKING_EXAMPLE_IDS,
  rankingExamplesByLanguage,
} from './ranking-examples.ts'

describe('ranking examples', () => {
  it('provides seven valid lists in both languages', () => {
    for (const language of ['de', 'en'] as const) {
      const examples = rankingExamplesByLanguage[language]

      expect(Object.keys(examples)).toEqual([...RANKING_EXAMPLE_IDS])

      for (const id of RANKING_EXAMPLE_IDS) {
        const example = examples[id]
        expect(example.title).not.toHaveLength(0)
        expect(example.items).toHaveLength(7)
        expect(analyzeRankingInput(example.items.join('\n'), language)).toEqual({
          labels: example.items,
          error: null,
          warning: null,
        })
      }
    }
  })

  it('describes the goal of every ranking in both languages', () => {
    expect(
      RANKING_EXAMPLE_IDS.map(
        (id) => rankingExamplesByLanguage.de[id].title,
      ),
    ).toEqual([
      'Was ist mir bei einer Wohnung am wichtigsten?',
      'Was ist mir bei der Arbeit am wichtigsten?',
      'Welche Superkraft hätte ich am liebsten?',
      'Auf welche Erfindung könnte ich am wenigsten verzichten?',
      'Was würde ich auf eine einsame Insel mitnehmen?',
      'Wohin würde ich am liebsten reisen?',
      'Welche Eissorte mag ich am liebsten?',
    ])
    expect(
      RANKING_EXAMPLE_IDS.map(
        (id) => rankingExamplesByLanguage.en[id].title,
      ),
    ).toEqual([
      'What matters most to me in an apartment?',
      'What matters most to me at work?',
      'Which superpower would I most like to have?',
      'Which invention could I least live without?',
      'What would I take to a desert island?',
      'Where would I most like to travel?',
      'Which ice cream flavor do I like best?',
    ])
  })

  it('picks three unique examples', () => {
    const selectedIds = pickRankingExampleIds([], () => 0)

    expect(selectedIds).toHaveLength(3)
    expect(new Set(selectedIds)).toHaveLength(3)
  })

  it('replaces the visible examples with three different ones', () => {
    const visibleIds = pickRankingExampleIds([], () => 0)
    const replacementIds = pickRankingExampleIds(visibleIds, () => 0)

    expect(replacementIds).toHaveLength(3)
    expect(replacementIds).not.toEqual(visibleIds)
    expect(replacementIds.every((id) => !visibleIds.includes(id))).toBe(true)
  })
})
