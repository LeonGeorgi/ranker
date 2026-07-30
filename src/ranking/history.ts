import {
  deriveRankingSnapshot,
  parseRankingSession,
  serializeRankingSession,
} from './session.ts'
import {
  RANKING_HISTORY_VERSION,
  type RankingHistory,
  type RankingHistoryEntry,
  type RankingSession,
} from './types.ts'

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
  if (deriveRankingSnapshot(session).finalRanking === null) {
    return null
  }

  return { id, savedAt, session }
}

export function addRankingHistoryEntry(
  history: RankingHistory,
  entry: RankingHistoryEntry,
): RankingHistory {
  const serializedSession = serializeRankingSession(entry.session)
  if (
    history.entries.some(
      (existingEntry) =>
        existingEntry.id === entry.id ||
        serializeRankingSession(existingEntry.session) === serializedSession,
    )
  ) {
    return history
  }

  return {
    version: RANKING_HISTORY_VERSION,
    entries: [entry, ...history.entries],
  }
}

export function serializeRankingHistory(history: RankingHistory): string {
  const parsedHistory = parseRankingHistory(history)
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

export function parseRankingHistory(value: unknown): RankingHistory | null {
  if (!isRecord(value)) {
    return null
  }

  const { version, entries: entryValues } = value
  if (
    version !== RANKING_HISTORY_VERSION ||
    !Array.isArray(entryValues)
  ) {
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
    if (
      session === null ||
      deriveRankingSnapshot(session).finalRanking === null
    ) {
      return null
    }

    entries.push({ id, savedAt, session })
    entryIds.add(id)
  }

  return {
    version: RANKING_HISTORY_VERSION,
    entries,
  }
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
  return typeof value === 'object' && value !== null
}
