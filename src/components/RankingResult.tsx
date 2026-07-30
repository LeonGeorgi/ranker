import { useState } from 'react'
import { copyByLanguage, type Language } from '../i18n.ts'
import type { RankingItem } from '../ranking/types.ts'
import { UndoIcon } from './UndoIcon.tsx'
import './RankingResult.css'

interface RankingResultProps {
  readonly animateReveal: boolean
  readonly decisionCount: number
  readonly language: Language
  readonly onEditList: () => void
  readonly onUndo: () => void
  readonly ranking: readonly RankingItem[]
  readonly storageWarning: string | null
}

type CopyStatus = 'idle' | 'copied' | 'failed'

export function RankingResult({
  animateReveal,
  decisionCount,
  language,
  onEditList,
  onUndo,
  ranking,
  storageWarning,
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

  return (
    <section
      className={
        animateReveal
          ? 'result-panel result-panel--revealing'
          : 'result-panel'
      }
      aria-labelledby="result-title"
    >
      <div className="result-panel__header">
        <div>
          <p className="section-kicker">{copy.resultKicker}</p>
          <h1 id="result-title" tabIndex={-1}>
            {copy.resultTitle}
          </h1>
        </div>
        <p>{copy.decisionCount(decisionCount)}</p>
      </div>

      <div className="result-panel__buttons">
        <button
          type="button"
          className="secondary-action"
          onClick={() => void copyRanking()}
        >
          {copyStatus === 'copied' ? copy.copied : copy.copyList}
        </button>
        <button type="button" className="text-action" onClick={onUndo}>
          <UndoIcon />
          {copy.changeLastDecision}
        </button>
        <button type="button" className="text-action" onClick={onEditList}>
          {copy.newRanking}
        </button>
      </div>

      <p className="visually-hidden" aria-live="polite">
        {copyStatus === 'copied' ? copy.copied : ''}
      </p>

      {copyStatus === 'failed' && (
        <p className="copy-error" role="status">
          {copy.copyFailed}
        </p>
      )}

      {storageWarning !== null && (
        <p className="result-storage-warning" role="status">
          {storageWarning}
        </p>
      )}

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
    </section>
  )
}
