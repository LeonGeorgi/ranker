import { useState } from 'react'
import { copyByLanguage, type Language } from '../i18n.ts'
import type { RankingItem } from '../ranking/types.ts'
import './RankingResult.css'

interface RankingResultProps {
  readonly decisionCount: number
  readonly isRevealed: boolean
  readonly language: Language
  readonly onEditList: () => void
  readonly onReveal: () => void
  readonly onUndo: () => void
  readonly ranking: readonly RankingItem[]
}

type CopyStatus = 'idle' | 'copied' | 'failed'

export function RankingResult({
  decisionCount,
  isRevealed,
  language,
  onEditList,
  onReveal,
  onUndo,
  ranking,
}: RankingResultProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const copy = copyByLanguage[language].result

  const copyRanking = async () => {
    if (navigator.clipboard === undefined) {
      setCopyStatus('failed')
      return
    }

    const text = ranking
      .map((item, index) => `${index + 1}. ${item.label}`)
      .join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  if (!isRevealed) {
    return (
      <section className="result-panel result-panel--ready" aria-labelledby="result-ready-title">
        <div className="result-ready__mark" aria-hidden="true">
          ✓
        </div>
        <p className="section-kicker">{copy.readyKicker}</p>
        <h1 id="result-ready-title">{copy.readyTitle}</h1>
        <p className="result-panel__description">
          {copy.readyDescription(decisionCount)}
        </p>
        <button type="button" className="primary-action" onClick={onReveal}>
          {copy.reveal} <span aria-hidden="true">→</span>
        </button>
        <div className="result-panel__actions">
          <button type="button" className="text-action" onClick={onUndo}>
            <span aria-hidden="true">↶</span> {copy.changeLastDecision}
          </button>
          <button type="button" className="text-action" onClick={onEditList}>
            {copy.newRanking}
          </button>
        </div>
        <p className="visually-hidden" aria-live="polite">
          {copy.readyAnnouncement}
        </p>
      </section>
    )
  }

  return (
    <section className="result-panel" aria-labelledby="result-title">
      <div className="result-panel__header">
        <div>
          <p className="section-kicker">{copy.resultKicker}</p>
          <h1 id="result-title">{copy.resultTitle}</h1>
        </div>
        <p>{copy.decisionCount(decisionCount)}</p>
      </div>

      <ol className="ranking-list">
        {ranking.map((item, index) => (
          <li key={item.id}>
            <span className="ranking-list__position">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="ranking-list__label">{item.label}</span>
          </li>
        ))}
      </ol>

      <div className="result-panel__buttons">
        <button type="button" className="secondary-action" onClick={() => void copyRanking()}>
          {copyStatus === 'copied' ? copy.copied : copy.copyList}
        </button>
        <button type="button" className="text-action" onClick={onEditList}>
          {copy.newRanking}
        </button>
      </div>

      {copyStatus === 'failed' && (
        <p className="copy-error" role="status">
          {copy.copyFailed}
        </p>
      )}
    </section>
  )
}
