import {
  copyByLanguage,
  DEFAULT_LANGUAGE,
  type Language,
} from '../i18n.ts'
import {
  MAX_RANKING_ITEMS,
  MAX_RANKING_LABEL_LENGTH,
} from './types.ts'

export interface RankingInputAnalysis {
  readonly error: string | null
  readonly labels: readonly string[]
  readonly warning: string | null
}

interface InputEntry {
  readonly label: string
  readonly lineNumber: number
}

export function analyzeRankingInput(
  source: string,
  language: Language = DEFAULT_LANGUAGE,
): RankingInputAnalysis {
  const copy = copyByLanguage[language].input
  const entries = source
    .split(/\r?\n/u)
    .map((label, index): InputEntry => ({
      label: label.trim(),
      lineNumber: index + 1,
    }))
    .filter((entry) => entry.label.length > 0)
  const labels = entries.map((entry) => entry.label)
  const longEntry = entries.find(
    (entry) => entry.label.length > MAX_RANKING_LABEL_LENGTH,
  )

  if (longEntry !== undefined) {
    return {
      labels,
      error: copy.lineTooLong(
        longEntry.lineNumber,
        MAX_RANKING_LABEL_LENGTH,
      ),
      warning: null,
    }
  }

  if (labels.length > MAX_RANKING_ITEMS) {
    return {
      labels,
      error: copy.tooManyItems(MAX_RANKING_ITEMS),
      warning: null,
    }
  }

  const firstEntryByNormalizedLabel = new Map<string, InputEntry>()
  for (const entry of entries) {
    // Duplicate semantics remain German regardless of presentation language.
    const normalizedLabel = entry.label.toLocaleLowerCase('de-DE')
    const firstEntry = firstEntryByNormalizedLabel.get(normalizedLabel)

    if (firstEntry !== undefined) {
      return {
        labels,
        error: copy.duplicate(
          entry.label,
          firstEntry.lineNumber,
          entry.lineNumber,
        ),
        warning: null,
      }
    }

    firstEntryByNormalizedLabel.set(normalizedLabel, entry)
  }

  if (labels.length < 2) {
    return {
      labels,
      error: copy.tooFewItems,
      warning: null,
    }
  }

  return {
    labels,
    error: null,
    warning: labels.length > 30 ? copy.longSession : null,
  }
}
