import { useEffect, useMemo, useRef } from 'react'
import { copyByLanguage, type Language } from '../i18n.ts'
import {
  deriveRankingSnapshot,
  type RankingHistoryEntry,
} from '../ranking/index.ts'
import './RankingHistoryDialog.css'

interface RankingHistoryDialogProps {
  readonly history: readonly RankingHistoryEntry[]
  readonly isOpen: boolean
  readonly language: Language
  readonly onClose: () => void
}

interface RankingHistoryItemProps {
  readonly entry: RankingHistoryEntry
  readonly formatDate: (timestamp: number) => string
  readonly language: Language
}

function RankingHistoryItem({
  entry,
  formatDate,
  language,
}: RankingHistoryItemProps) {
  const copy = copyByLanguage[language].history
  const ranking = deriveRankingSnapshot(entry.session).finalRanking
  if (ranking === null) {
    return null
  }

  const date = new Date(entry.savedAt)
  const formattedDate = formatDate(entry.savedAt)

  return (
    <li className="history-entry">
      <details>
        <summary>
          <time
            className="history-entry__title"
            dateTime={date.toISOString()}
          >
            {copy.savedOn(formattedDate)}
          </time>
          <span className="history-entry__meta">
            {copy.entrySummary(
              entry.session.items.length,
              entry.session.decisions.length,
            )}
          </span>
        </summary>
        <ol className="history-entry__ranking">
          {ranking.map((item) => (
            <li key={item.id}>{item.label}</li>
          ))}
        </ol>
      </details>
    </li>
  )
}

export function RankingHistoryDialog({
  history,
  isOpen,
  language,
  onClose,
}: RankingHistoryDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const copy = copyByLanguage[language].history
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [language],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) {
      return
    }

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      id="ranking-history-dialog"
      className="history-dialog"
      aria-labelledby="ranking-history-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={onClose}
    >
      <div className="history-dialog__header">
        <div>
          <p className="section-kicker">{copy.kicker}</p>
          <h2 id="ranking-history-title">{copy.title}</h2>
        </div>
        <button
          type="button"
          className="history-dialog__close"
          aria-label={copy.close}
          title={copy.close}
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="history-dialog__content">
        {history.length === 0 ? (
          <p className="history-dialog__empty">{copy.empty}</p>
        ) : (
          <ol className="history-dialog__list">
            {history.map((entry) => (
              <RankingHistoryItem
                key={entry.id}
                entry={entry}
                formatDate={(timestamp) => dateFormatter.format(timestamp)}
                language={language}
              />
            ))}
          </ol>
        )}
      </div>
    </dialog>
  )
}
