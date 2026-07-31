import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { copyByLanguage, type Language } from '../i18n.ts'
import {
  pickRankingExampleIds,
  rankingExamplesByLanguage,
  type RankingExampleId,
} from '../ranking-examples.ts'
import { analyzeRankingInput } from '../ranking/input.ts'
import { getExpectedDecisionCount } from '../ranking/session.ts'
import './ListSetup.css'

interface ListSetupProps {
  readonly draft: string
  readonly language: Language
  readonly onDraftChange: (value: string) => void
  readonly onStart: (labels: readonly string[]) => void
  readonly storageWarning: string | null
}

export function ListSetup({
  draft,
  language,
  onDraftChange,
  onStart,
  storageWarning,
}: ListSetupProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [exampleIds, setExampleIds] = useState<
    readonly RankingExampleId[]
  >(() => pickRankingExampleIds())
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const copy = copyByLanguage[language].setup
  const examples = rankingExamplesByLanguage[language]
  const analysis = useMemo(
    () => analyzeRankingInput(draft, language),
    [draft, language],
  )
  const shouldShowError =
    analysis.error !== null && (hasSubmitted || draft.trim().length > 0)
  const countLabel = copy.itemCount(analysis.labels.length)
  const expectedDecisionCount = Math.round(
    getExpectedDecisionCount(analysis.labels.length),
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasSubmitted(true)

    if (analysis.error === null) {
      onStart(analysis.labels)
    }
  }

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const insertExample = (exampleId: RankingExampleId) => {
    onDraftChange(examples[exampleId].items.join('\n'))
    setHasSubmitted(false)

    textareaRef.current?.focus({ preventScroll: true })
    textareaRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'center',
    })
  }

  return (
    <section className="setup-panel" aria-labelledby="setup-title">
      <div className="setup-panel__intro">
        <h1 id="setup-title" tabIndex={-1}>
          {copy.title}
        </h1>
        <p>{copy.description}</p>
      </div>

      <form className="setup-form" onSubmit={handleSubmit} noValidate>
        <div className="setup-form__custom-list">
          <div className="setup-form__label-row">
            <label htmlFor="ranking-items">{copy.listLabel}</label>
            <span className="setup-form__meta">
              <span>{countLabel}</span>
              {analysis.error === null && (
                <span>{copy.expectedComparisons(expectedDecisionCount)}</span>
              )}
            </span>
          </div>
          <p id="ranking-items-help" className="field-help">
            {copy.help}
          </p>
          <textarea
            ref={textareaRef}
            id="ranking-items"
            name="ranking-items"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={handleTextareaKeyDown}
            aria-describedby="ranking-items-help ranking-items-feedback"
            aria-invalid={shouldShowError}
            placeholder={copy.placeholder}
            rows={7}
          />

          <div id="ranking-items-feedback" className="setup-form__feedback">
            {shouldShowError && (
              <p className="field-message field-message--error" role="alert">
                {analysis.error}
              </p>
            )}
            {analysis.error === null && analysis.warning !== null && (
              <p className="field-message field-message--warning">
                {analysis.warning}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="primary-action setup-form__submit"
            disabled={analysis.error !== null}
          >
            {copy.start}
          </button>
        </div>

        <div className="setup-examples">
          <div className="setup-examples__header">
            <p id="ranking-examples-label" className="setup-examples__title">
              {copy.examplesLabel}
            </p>
            <button
              type="button"
              className="text-action setup-examples__replace"
              onClick={() =>
                setExampleIds((currentIds) =>
                  pickRankingExampleIds(currentIds),
                )
              }
            >
              <span aria-hidden="true">↻</span>
              {copy.replaceExamples}
            </button>
          </div>
          <div
            className="setup-examples__choices"
            role="group"
            aria-labelledby="ranking-examples-label"
          >
            {exampleIds.map((exampleId) => {
              const example = examples[exampleId]

              return (
                <button
                  key={exampleId}
                  type="button"
                  className="setup-examples__choice"
                  aria-label={copy.insertExample(example.title)}
                  onClick={() => insertExample(exampleId)}
                >
                  {example.title}
                </button>
              )
            })}
          </div>
        </div>

        <div className="setup-form__status">
          <p className="local-note">{copy.localNote}</p>
          {storageWarning !== null && (
            <p className="setup-storage-warning" role="status">
              {storageWarning}
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
