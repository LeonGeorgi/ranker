export const RANKING_SESSION_VERSION = 1
export const RANKING_HISTORY_VERSION = 2
export const MAX_RANKING_ITEMS = 50
export const MAX_RANKING_LABEL_LENGTH = 120
export const MAX_RANKING_HISTORY_ENTRIES = 50

export interface RankingItem {
  readonly id: string
  readonly label: string
}

export interface RankingDecision {
  readonly betterItemId: string
  readonly worseItemId: string
}

/**
 * The canonical session contains only source input and user decisions. All
 * scheduler and merge state is reconstructed from this log so undo and reload
 * cannot leave derived state out of sync.
 */
export interface RankingSession {
  readonly version: typeof RANKING_SESSION_VERSION
  readonly seed: number
  readonly items: readonly RankingItem[]
  readonly decisions: readonly RankingDecision[]
}

export interface RankingHistoryEntry {
  readonly id: string
  readonly savedAt: number
  /** Best to worst, stored independently of the ranking algorithm. */
  readonly ranking: readonly string[]
  readonly decisionCount: number
}

export interface RankingHistory {
  readonly version: typeof RANKING_HISTORY_VERSION
  readonly entries: readonly RankingHistoryEntry[]
}

export type ComparisonKind = 'discovery-pair' | 'merge'

export interface RankingQuestion {
  readonly id: string
  readonly decisionNumber: number
  readonly mergeId: string
  readonly kind: ComparisonKind
  readonly left: RankingItem
  readonly right: RankingItem
  readonly introducedItemIds: readonly string[]
}

export interface ComparisonEdge {
  readonly id: string
  /** G6 source: the less preferred item. */
  readonly sourceItemId: string
  /** G6 target: the preferred item, so the arrow points to the winner. */
  readonly targetItemId: string
  readonly decisionNumber: number
  readonly isLatest: boolean
}

export interface RankingGraph {
  readonly nodes: readonly RankingItem[]
  readonly edges: readonly ComparisonEdge[]
}

export interface RankingProgress {
  readonly totalItemCount: number
  readonly visibleItemCount: number
  readonly remainingItemCount: number
  readonly decisionCount: number
  readonly connectedComponentCount: number
  readonly completedMergeCount: number
  readonly totalMergeCount: number
  readonly determinedPairCount: number
  readonly totalPairCount: number
  readonly determinedFraction: number
  readonly maximumDecisionCount: number
  readonly isComplete: boolean
}

export interface RankingSnapshot {
  readonly currentQuestion: RankingQuestion | null
  readonly graph: RankingGraph
  readonly progress: RankingProgress
  /** Best to worst; present only when the ranking is uniquely determined. */
  readonly finalRanking: readonly RankingItem[] | null
}
