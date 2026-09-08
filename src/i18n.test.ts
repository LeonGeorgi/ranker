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

  it('localizes compact mobile controls', () => {
    expect(copyByLanguage.de.header.settings).toBe('Einstellungen')
    expect(copyByLanguage.en.header.settings).toBe('Settings')
    expect(copyByLanguage.de.graph.expand).toBe(
      'Große Graphansicht öffnen',
    )
    expect(copyByLanguage.en.graph.collapse).toBe(
      'Show compact graph view',
    )
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
    expect(copyByLanguage.de.sessionSummary(2, 1)).toBe('2 Einträge · 1 Entscheidung')
    expect(copyByLanguage.en.sessionSummary(3, 2)).toBe('3 items · 2 decisions')
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
      'Verlauf öffnen, 1 gespeicherte Rangliste',
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

  it('gives setup and comparison distinct prompts', () => {
    expect(copyByLanguage.de.setup.title).toBe('Neue Rangliste')
    expect(copyByLanguage.de.comparison.title).toBe('Was ist dir lieber?')
    expect(copyByLanguage.en.setup.title).toBe('New ranking')
    expect(copyByLanguage.en.comparison.title).toBe('Which do you prefer?')
  })

  it('summarizes ranking progress without exposing scheduler details', () => {
    expect(copyByLanguage.de.comparison.progressSummary(40)).toBe(
      '40 % der Reihenfolge bestimmt',
    )
    expect(copyByLanguage.en.comparison.progressSummary(10)).toBe(
      '10% of the order determined',
    )
  })
})
