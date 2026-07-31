import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { formatRankingForClipboard } from '../ranking/output.ts'
import { RankingResult } from './RankingResult.tsx'

const ranking = [
  { id: 'item-1', label: 'Erster Platz' },
  { id: 'item-2', label: 'Zweiter Platz' },
]

function renderResult(animateReveal: boolean): string {
  return renderToStaticMarkup(
    <RankingResult
      animateReveal={animateReveal}
      decisionCount={1}
      language="de"
      ranking={ranking}
      storageWarning={null}
      onEditList={vi.fn()}
      onUndo={vi.fn()}
    />,
  )
}

describe('RankingResult', () => {
  it('renders the finished ranking and undo action without a reveal gate', () => {
    const markup = renderResult(false)

    expect(markup).toContain('Deine Rangliste')
    expect(markup).toContain('Erster Platz')
    expect(markup).toContain('Zweiter Platz')
    expect(markup).toContain('Letzte Entscheidung ändern')
    expect(markup).not.toContain('Rangliste anzeigen')
    expect(markup).not.toContain('result-panel--revealing')
  })

  it('adds the short reveal animation only when requested', () => {
    expect(renderResult(true)).toContain('result-panel--revealing')
  })

  it('formats copied rankings as reusable one-label-per-line input', () => {
    expect(formatRankingForClipboard(ranking)).toBe(
      'Erster Platz\nZweiter Platz',
    )
  })
})
