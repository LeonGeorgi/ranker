import { useState } from 'react'
import { copyByLanguage, type Language } from '../i18n.ts'
import { formatRankingForClipboard } from '../ranking/output.ts'
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

    try {
      await navigator.clipboard.writeText(formatRankingForClipboard(ranking))
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
      <p className="session-summary">
        {copyByLanguage[language].sessionSummary(ranking.length, decisionCount)}
      </p>
      <div className="result-panel__header">
        <h1 id="result-title" tabIndex={-1}>
          {copy.resultTitle}
        </h1>
        <svg
          className="result-panel__complete"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="m4 10 4 4 8-8" />
        </svg>
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
        {ranking.map((item) => (
          <li key={item.id}>
            <span className="ranking-list__label">{item.label}</span>
          </li>
        ))}
      </ol>

      <div className="result-panel__buttons">
        <button
          type="button"
          className="primary-action"
          onClick={() => void copyRanking()}
        >
          {copyStatus === 'copied' ? copy.copied : copy.copyList}
        </button>
        <button type="button" className="text-action" onClick={onEditList}>
          {copy.newRanking}
        </button>
      </div>
      <button
        type="button"
        className="text-action result-panel__undo"
        onClick={onUndo}
      >
        <UndoIcon />
        {copy.changeLastDecision}
      </button>
    </section>
  )
}
