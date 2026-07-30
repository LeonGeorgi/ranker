import { describe, expect, it } from 'vitest'
import { copyByLanguage, DEFAULT_LANGUAGE } from './i18n.ts'

describe('interface copy', () => {
  it('uses English as the default language', () => {
    expect(DEFAULT_LANGUAGE).toBe('en')
  })

  it('localizes every theme preference', () => {
    expect(copyByLanguage.de.theme).toEqual({
      pickerLabel: 'Darstellung',
      systemLabel: 'System',
      lightLabel: 'Hell',
      darkLabel: 'Dunkel',
    })
    expect(copyByLanguage.en.theme).toEqual({
      pickerLabel: 'Appearance',
      systemLabel: 'System',
      lightLabel: 'Light',
      darkLabel: 'Dark',
    })
  })

  it('formats German and English singulars and plurals', () => {
    expect(copyByLanguage.de.setup.itemCount(1)).toBe('1 Eintrag')
    expect(copyByLanguage.de.setup.itemCount(2)).toBe('2 Einträge')
    expect(copyByLanguage.en.setup.itemCount(1)).toBe('1 item')
    expect(copyByLanguage.en.setup.itemCount(2)).toBe('2 items')
    expect(copyByLanguage.de.setup.expectedComparisons(1)).toBe(
      'Voraussichtlich 1 Vergleich',
    )
    expect(copyByLanguage.de.setup.expectedComparisons(23)).toBe(
      'Voraussichtlich 23 Vergleiche',
    )
    expect(copyByLanguage.en.setup.expectedComparisons(1)).toBe(
      'About 1 comparison expected',
    )
    expect(copyByLanguage.en.setup.expectedComparisons(23)).toBe(
      'About 23 comparisons expected',
    )
    expect(copyByLanguage.de.result.decisionCount(1)).toBe('1 Entscheidung')
    expect(copyByLanguage.en.result.decisionCount(2)).toBe('2 decisions')
  })

  it('localizes dynamic graph descriptions', () => {
    expect(copyByLanguage.de.graph.description(1, 1)).toBe(
      '1 sichtbarer Eintrag und 1 Entscheidung. Pfeile zeigen zum höher eingeordneten Eintrag.',
    )
    expect(copyByLanguage.en.graph.description(2, 3)).toBe(
      '2 visible items and 3 decisions. Arrows point to the higher-ranked item.',
    )
  })

  it('localizes history labels and counts', () => {
    expect(copyByLanguage.de.history.openLabel(0)).toBe('Verlauf öffnen')
    expect(copyByLanguage.de.history.openLabel(1)).toBe(
      'Verlauf öffnen, 1 gespeichertes Ranking',
    )
    expect(copyByLanguage.en.history.openLabel(2)).toBe(
      'Open history, 2 saved rankings',
    )
    expect(copyByLanguage.de.history.entrySummary(2, 1)).toBe(
      '2 Einträge · 1 Entscheidung',
    )
    expect(copyByLanguage.en.history.entrySummary(1, 2)).toBe(
      '1 item · 2 decisions',
    )
  })

  it('uses criterion-neutral wording for comparisons', () => {
    expect(copyByLanguage.de.setup.title).toBe('Was gewinnt?')
    expect(copyByLanguage.de.comparison.title).toBe('Was gewinnt?')
    expect(copyByLanguage.en.setup.title).toBe('What wins?')
    expect(copyByLanguage.en.comparison.title).toBe('What wins?')
  })
})
