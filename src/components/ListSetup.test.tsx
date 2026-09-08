import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { copyByLanguage, type Language } from '../i18n.ts'
import { ListSetup } from './ListSetup.tsx'

function renderSetup(draft: string, language: Language): string {
  return renderToStaticMarkup(
    <ListSetup
      draft={draft}
      language={language}
      onDraftChange={vi.fn()}
      onStart={vi.fn()}
      storageWarning={null}
    />,
  )
}

describe('list setup', () => {
  it.each(['de', 'en'] as const)('keeps the empty %s field distinct from example entries', (language) => {
    const copy = copyByLanguage[language].setup
    const markup = renderSetup('', language)

    expect(markup).toContain(copy.placeholder)
    expect(markup).toMatch(/<textarea[^>]*><\/textarea>/)
    expect(markup).toContain(copy.itemCount(0))
    expect(markup).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/)
    expect(markup).not.toContain(copy.expectedComparisons(0))
  })

  it('counts a real list and presents its comparison estimate next to the start action', () => {
    const markup = renderSetup('Lesen\nKochen\nMusik\nSpazieren', 'de')

    expect(markup).toContain('4 Einträge')
    expect(markup).toContain('Voraussichtlich 5 Vergleiche')
    expect(markup).not.toContain('disabled=""')
  })
})
