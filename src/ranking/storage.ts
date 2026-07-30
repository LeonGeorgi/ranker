import {
  deserializeRankingSession,
  serializeRankingSession,
} from './session.ts'
import {
  createEmptyRankingHistory,
  deserializeRankingHistory,
  serializeRankingHistory,
} from './history.ts'
import type { RankingHistory, RankingSession } from './types.ts'

export const RANKING_STORAGE_KEY = 'ranker.ranking-session.v1'
export const RANKING_HISTORY_STORAGE_KEY = 'ranker.ranking-history.v1'

export interface RankingStorage {
  getItem(key: string): string | null
  removeItem(key: string): void
  setItem(key: string, value: string): void
}

export type StoredSessionIssue = 'invalid' | 'unavailable' | null

export interface StoredSessionResult {
  readonly issue: StoredSessionIssue
  readonly session: RankingSession | null
}

export interface StoredHistoryResult {
  readonly history: RankingHistory
  readonly issue: StoredSessionIssue
}

export function readStoredRankingSession(
  storage: RankingStorage,
): StoredSessionResult {
  try {
    const serializedSession = storage.getItem(RANKING_STORAGE_KEY)
    if (serializedSession === null) {
      return { session: null, issue: null }
    }

    const session = deserializeRankingSession(serializedSession)
    return session === null
      ? { session: null, issue: 'invalid' }
      : { session, issue: null }
  } catch {
    return { session: null, issue: 'unavailable' }
  }
}

export function writeStoredRankingSession(
  storage: RankingStorage,
  session: RankingSession,
): boolean {
  try {
    storage.setItem(RANKING_STORAGE_KEY, serializeRankingSession(session))
    return true
  } catch {
    return false
  }
}

export function clearStoredRankingSession(storage: RankingStorage): boolean {
  try {
    storage.removeItem(RANKING_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function readStoredRankingHistory(
  storage: RankingStorage,
): StoredHistoryResult {
  try {
    const serializedHistory = storage.getItem(RANKING_HISTORY_STORAGE_KEY)
    if (serializedHistory === null) {
      return { history: createEmptyRankingHistory(), issue: null }
    }

    const history = deserializeRankingHistory(serializedHistory)
    return history === null
      ? { history: createEmptyRankingHistory(), issue: 'invalid' }
      : { history, issue: null }
  } catch {
    return { history: createEmptyRankingHistory(), issue: 'unavailable' }
  }
}

export function writeStoredRankingHistory(
  storage: RankingStorage,
  history: RankingHistory,
): boolean {
  try {
    storage.setItem(
      RANKING_HISTORY_STORAGE_KEY,
      serializeRankingHistory(history),
    )
    return true
  } catch {
    return false
  }
}
