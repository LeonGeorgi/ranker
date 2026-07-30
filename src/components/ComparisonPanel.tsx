import { useEffect } from 'react'
import { copyByLanguage, type Language } from '../i18n.ts'
import type { RankingSnapshot } from '../ranking/types.ts'
import './ComparisonPanel.css'

interface ComparisonPanelProps {
  readonly areKeyboardShortcutsEnabled: boolean
  readonly language: Language
  readonly onChoose: (preferredItemId: string, questionId: string) => void
  readonly onEditList: () => void
  readonly onUndo: () => void
  readonly snapshot: RankingSnapshot
  readonly storageWarning: string | null
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

export function ComparisonPanel({
  areKeyboardShortcutsEnabled,
  language,
  onChoose,
  onEditList,
  onUndo,
  snapshot,
  storageWarning,
}: ComparisonPanelProps) {
  const question = snapshot.currentQuestion

  useEffect(() => {
    if (question === null || !areKeyboardShortcutsEnabled) {
      return
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.repeat || isTypingTarget(event.target)) {
        return
      }

      if (event.key === '1' || event.key === 'ArrowLeft') {
        event.preventDefault()
        onChoose(question.left.id, question.id)
      } else if (event.key === '2' || event.key === 'ArrowRight') {
        event.preventDefault()
        onChoose(question.right.id, question.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [areKeyboardShortcutsEnabled, onChoose, question])

  if (question === null) {
    return null
  }

  const { progress } = snapshot
  const copy = copyByLanguage[language].comparison
  const determinedPercent = Math.round(progress.determinedFraction * 100)
  const questionKindLabel =
    question.kind === 'discovery-pair'
      ? copy.discoveryPair
      : copy.merge

  return (
    <section className="comparison-panel" aria-labelledby="comparison-title">
      <div className="comparison-progress">
        <div className="comparison-progress__facts">
          <span>
            <strong>{progress.visibleItemCount}</strong>{' '}
            {copy.visibleItems(progress.totalItemCount)}
          </span>
          <span>
            <strong>{progress.decisionCount}</strong>{' '}
            {copy.decisionsLabel(progress.decisionCount)}
          </span>
        </div>
        <div
          className="comparison-progress__track"
          role="progressbar"
          aria-label={copy.progressLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={determinedPercent}
        >
          <span style={{ width: `${determinedPercent}%` }} />
        </div>
        <p>{copy.determinedProgress(determinedPercent)}</p>
      </div>

      <div className="comparison-panel__question" key={question.id}>
        <p className="section-kicker">{questionKindLabel}</p>
        <h1 id="comparison-title">{copy.title}</h1>
        <p className="comparison-panel__hint">{copy.hint}</p>

        <div className="choice-stack">
          <button
            type="button"
            className="choice-button"
            onClick={() => onChoose(question.left.id, question.id)}
            aria-keyshortcuts="1 ArrowLeft"
          >
            <span className="choice-button__number">01</span>
            <span className="choice-button__label">{question.left.label}</span>
            <span className="choice-button__key" aria-hidden="true">
              ←
            </span>
          </button>

          <span className="choice-divider">{copy.divider}</span>

          <button
            type="button"
            className="choice-button"
            onClick={() => onChoose(question.right.id, question.id)}
            aria-keyshortcuts="2 ArrowRight"
          >
            <span className="choice-button__number">02</span>
            <span className="choice-button__label">{question.right.label}</span>
            <span className="choice-button__key" aria-hidden="true">
              →
            </span>
          </button>
        </div>

        <p className="keyboard-note">{copy.keyboardTip}</p>
      </div>

      <div className="comparison-panel__footer">
        <button
          type="button"
          className="text-action"
          onClick={onUndo}
          disabled={progress.decisionCount === 0}
        >
          <span aria-hidden="true">↶</span> {copy.undo}
        </button>
        <button type="button" className="text-action" onClick={onEditList}>
          {copy.editList}
        </button>
      </div>

      {storageWarning !== null && (
        <p className="storage-warning" role="status">
          {storageWarning}
        </p>
      )}

      <p className="visually-hidden" aria-live="polite">
        {copy.liveQuestion(
          question.decisionNumber,
          question.left.label,
          question.right.label,
        )}
      </p>
    </section>
  )
}
