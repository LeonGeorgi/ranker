import {
  deriveRankingSnapshot,
  getMaximumDecisionCount,
  parseRankingSession,
} from './session.ts'
import {
  MAX_RANKING_HISTORY_ENTRIES,
  MAX_RANKING_ITEMS,
  MAX_RANKING_LABEL_LENGTH,
  RANKING_HISTORY_VERSION,
  type RankingHistory,
  type RankingHistoryEntry,
  type RankingSession,
} from './types.ts'

const LEGACY_RANKING_HISTORY_VERSION = 1
const MAX_HISTORY_ENTRY_ID_LENGTH = 128
const MAX_DATE_TIMESTAMP = 8_640_000_000_000_000

export function createEmptyRankingHistory(): RankingHistory {
  return {
    version: RANKING_HISTORY_VERSION,
    entries: [],
  }
}

export function createCompletedRankingHistoryEntry(
  session: RankingSession,
  id: string,
  savedAt: number,
): RankingHistoryEntry | null {
  if (!isValidHistoryEntryId(id)) {
    throw new TypeError('A ranking history entry needs a valid id.')
  }
  if (!isValidSavedAt(savedAt)) {
    throw new TypeError('A ranking history entry needs a valid timestamp.')
  }

  const snapshot = deriveRankingSnapshot(session)
  if (snapshot.finalRanking === null) {
    return null
  }

  return {
    id,
    savedAt,
    ranking: snapshot.finalRanking.map((item) => item.label),
    decisionCount: snapshot.progress.decisionCount,
  }
}

export function addRankingHistoryEntry(
  history: RankingHistory,
  entry: RankingHistoryEntry,
): RankingHistory {
  const parsedHistory = parseCurrentRankingHistory(history)
  const parsedEntry = parseCurrentRankingHistoryEntry(entry)
  if (parsedHistory === null || parsedEntry === null) {
    throw new TypeError('Cannot add an invalid ranking history entry.')
  }

  if (
    parsedHistory.entries.some(
      (existingEntry) =>
        existingEntry.id === parsedEntry.id ||
        hasSameSnapshot(existingEntry, parsedEntry),
    )
  ) {
    return history
  }

  return {
    version: RANKING_HISTORY_VERSION,
    entries: [parsedEntry, ...parsedHistory.entries].slice(
      0,
      MAX_RANKING_HISTORY_ENTRIES,
    ),
  }
}

export function serializeRankingHistory(history: RankingHistory): string {
  const parsedHistory = parseCurrentRankingHistory(history)
  if (parsedHistory === null) {
    throw new TypeError('Cannot serialize an invalid ranking history.')
  }

  return JSON.stringify(parsedHistory)
}

export function deserializeRankingHistory(
  serializedHistory: string,
): RankingHistory | null {
  try {
    const value: unknown = JSON.parse(serializedHistory)
    return parseRankingHistory(value)
  } catch {
    return null
  }
}

/**
 * Parses the current snapshot format and migrates legacy v1 session archives in
 * memory. Persistence decides when to write that migrated value under the v2
 * key, so the legacy data can remain untouched as a recovery source.
 */
export function parseRankingHistory(value: unknown): RankingHistory | null {
  if (!isRecord(value)) {
    return null
  }

  if (value.version === RANKING_HISTORY_VERSION) {
    return parseCurrentRankingHistory(value)
  }
  if (value.version === LEGACY_RANKING_HISTORY_VERSION) {
    return migrateLegacyRankingHistory(value)
  }

  return null
}

function parseCurrentRankingHistory(value: unknown): RankingHistory | null {
  if (!isRecord(value)) {
    return null
  }

  const { version, entries: entryValues } = value
  if (
    version !== RANKING_HISTORY_VERSION ||
    !Array.isArray(entryValues) ||
    entryValues.length > MAX_RANKING_HISTORY_ENTRIES
  ) {
    return null
  }

  const entries: RankingHistoryEntry[] = []
  const entryIds = new Set<string>()

  for (const entryValue of entryValues) {
    const entry = parseCurrentRankingHistoryEntry(entryValue)
    if (entry === null || entryIds.has(entry.id)) {
      return null
    }

    entries.push(entry)
    entryIds.add(entry.id)
  }

  return {
    version: RANKING_HISTORY_VERSION,
    entries,
  }
}

function parseCurrentRankingHistoryEntry(
  value: unknown,
): RankingHistoryEntry | null {
  if (!isRecord(value)) {
    return null
  }

  const { id, savedAt, ranking: rankingValue, decisionCount } = value
  if (
    !isValidHistoryEntryId(id) ||
    !isValidSavedAt(savedAt) ||
    !Array.isArray(rankingValue)
  ) {
    return null
  }

  const ranking = parseRankingLabels(rankingValue)
  if (
    ranking === null ||
    !Number.isSafeInteger(decisionCount) ||
    (decisionCount as number) < ranking.length - 1 ||
    (decisionCount as number) > getMaximumDecisionCount(ranking.length)
  ) {
    return null
  }

  return {
    id,
    savedAt,
    ranking,
    decisionCount: decisionCount as number,
  }
}

function migrateLegacyRankingHistory(
  value: Record<string, unknown>,
): RankingHistory | null {
  const entryValues = value.entries
  if (!Array.isArray(entryValues)) {
    return null
  }

  const entries: RankingHistoryEntry[] = []
  const entryIds = new Set<string>()

  for (const entryValue of entryValues) {
    if (!isRecord(entryValue)) {
      return null
    }

    const { id, savedAt, session: sessionValue } = entryValue
    if (
      !isValidHistoryEntryId(id) ||
      entryIds.has(id) ||
      !isValidSavedAt(savedAt)
    ) {
      return null
    }

    const session = parseRankingSession(sessionValue)
    if (session === null) {
      return null
    }

    const snapshot = deriveRankingSnapshot(session)
    if (snapshot.finalRanking === null) {
      return null
    }

    const ranking = parseRankingLabels(
      snapshot.finalRanking.map((item) => item.label),
    )
    if (ranking === null) {
      return null
    }

    if (entries.length < MAX_RANKING_HISTORY_ENTRIES) {
      entries.push({
        id,
        savedAt,
        ranking,
        decisionCount: snapshot.progress.decisionCount,
      })
    }
    entryIds.add(id)
  }

  return {
    version: RANKING_HISTORY_VERSION,
    entries,
  }
}

function parseRankingLabels(values: readonly unknown[]): readonly string[] | null {
  if (values.length < 2 || values.length > MAX_RANKING_ITEMS) {
    return null
  }

  const labels: string[] = []
  const normalizedLabels = new Set<string>()

  for (const value of values) {
    if (
      typeof value !== 'string' ||
      value.length === 0 ||
      value.length > MAX_RANKING_LABEL_LENGTH ||
      value.trim() !== value
    ) {
      return null
    }

    const normalizedLabel = value.toLocaleLowerCase('de-DE')
    if (normalizedLabels.has(normalizedLabel)) {
      return null
    }

    labels.push(value)
    normalizedLabels.add(normalizedLabel)
  }

  return labels
}

function hasSameSnapshot(
  left: RankingHistoryEntry,
  right: RankingHistoryEntry,
): boolean {
  return (
    left.decisionCount === right.decisionCount &&
    left.ranking.length === right.ranking.length &&
    left.ranking.every((label, index) => label === right.ranking[index])
  )
}

function isValidHistoryEntryId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_HISTORY_ENTRY_ID_LENGTH &&
    value.trim() === value
  )
}

function isValidSavedAt(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= MAX_DATE_TIMESTAMP
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
