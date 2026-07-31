import type { RankingItem } from './types.ts'

export function formatRankingForClipboard(
  ranking: readonly RankingItem[],
): string {
  return ranking.map((item) => item.label).join('\n')
}
