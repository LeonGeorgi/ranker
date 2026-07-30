import {
  deserializeRankingSession,
  serializeRankingSession,
} from './session.ts'
import type { RankingSession } from './types.ts'

export const RANKING_STORAGE_KEY = 'ranker.ranking-session.v1'

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
