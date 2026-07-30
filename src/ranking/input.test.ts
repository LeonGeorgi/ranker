import { describe, expect, it } from 'vitest'
import { analyzeRankingInput } from './input.ts'

describe('ranking input', () => {
  it('trims entries and ignores empty lines', () => {
    expect(analyzeRankingInput('  Schokolade  \n\nLakritz\n')).toEqual({
      labels: ['Schokolade', 'Lakritz'],
      error: null,
      warning: null,
    })
  })

  it('reports case-insensitive duplicates with their line numbers', () => {
    const analysis = analyzeRankingInput('Twix\nMars\n twix ')

    expect(analysis.error).toContain('Zeile 1 und 3')
  })

  it('localizes feedback without changing labels or German duplicate semantics', () => {
    const source = 'Äpfel\näPFEL'
    const germanAnalysis = analyzeRankingInput(source)
    const englishAnalysis = analyzeRankingInput(source, 'en')

    expect(englishAnalysis.labels).toEqual(germanAnalysis.labels)
    expect(germanAnalysis.error).toContain('Zeile 1 und 2')
    expect(englishAnalysis.error).toBe(
      '“äPFEL” appears on lines 1 and 2. Each item may appear only once.',
    )
  })

  it('warns about long sessions without rejecting them', () => {
    const source = Array.from(
      { length: 31 },
      (_, index) => `Eintrag ${index + 1}`,
    ).join('\n')

    const analysis = analyzeRankingInput(source)
    expect(analysis.error).toBeNull()
    expect(analysis.warning).not.toBeNull()
    expect(analyzeRankingInput(source, 'en').warning).toBe(
      'With more than 30 items, the ranking may take several minutes.',
    )
  })

  it('rejects fewer than two, more than fifty, and overly long entries', () => {
    expect(analyzeRankingInput('Nur einer').error).not.toBeNull()
    expect(
      analyzeRankingInput(
        Array.from({ length: 51 }, (_, index) => `${index}`).join('\n'),
      ).error,
    ).not.toBeNull()
    expect(analyzeRankingInput(`${'x'.repeat(121)}\nKurz`).error).not.toBeNull()
  })
})
