import type {
  ComparisonEdge,
  RankingDecision,
  RankingGraph,
  RankingItem,
} from './types.ts'

export function buildRankingGraph(
  items: readonly RankingItem[],
  decisions: readonly RankingDecision[],
): RankingGraph {
  const visibleItemIds = new Set<string>()

  const edges = decisions.map((decision, index): ComparisonEdge => {
    visibleItemIds.add(decision.betterItemId)
    visibleItemIds.add(decision.worseItemId)

    return {
      id: `comparison-${index + 1}`,
      sourceItemId: decision.worseItemId,
      targetItemId: decision.betterItemId,
      decisionNumber: index + 1,
      isLatest: index === decisions.length - 1,
    }
  })

  return {
    nodes: items.filter((item) => visibleItemIds.has(item.id)),
    edges,
  }
}

export function countVisibleComponents(
  decisions: readonly RankingDecision[],
): number {
  const neighbors = new Map<string, Set<string>>()

  for (const decision of decisions) {
    addNeighbor(neighbors, decision.betterItemId, decision.worseItemId)
    addNeighbor(neighbors, decision.worseItemId, decision.betterItemId)
  }

  const visited = new Set<string>()
  let componentCount = 0

  for (const itemId of neighbors.keys()) {
    if (visited.has(itemId)) {
      continue
    }

    componentCount += 1
    const pending = [itemId]

    while (pending.length > 0) {
      const currentId = pending.pop()
      if (currentId === undefined || visited.has(currentId)) {
        continue
      }

      visited.add(currentId)
      const currentNeighbors = neighbors.get(currentId)
      if (currentNeighbors !== undefined) {
        pending.push(...currentNeighbors)
      }
    }
  }

  return componentCount
}

export function countDeterminedPairs(
  items: readonly RankingItem[],
  decisions: readonly RankingDecision[],
): number {
  const betterToWorse = buildPreferenceAdjacency(items, decisions)
  let determinedPairCount = 0

  for (const item of items) {
    const reachable = new Set<string>()
    const pending = [...getNeighbors(betterToWorse, item.id)]

    while (pending.length > 0) {
      const currentId = pending.pop()
      if (currentId === undefined || reachable.has(currentId)) {
        continue
      }

      reachable.add(currentId)
      pending.push(...getNeighbors(betterToWorse, currentId))
    }

    reachable.delete(item.id)
    determinedPairCount += reachable.size
  }

  return determinedPairCount
}

export function getUniqueRanking(
  items: readonly RankingItem[],
  decisions: readonly RankingDecision[],
): readonly RankingItem[] | null {
  const itemById = new Map(items.map((item) => [item.id, item]))
  const betterToWorse = buildPreferenceAdjacency(items, decisions)
  const incomingEdgeCount = new Map(items.map((item) => [item.id, 0]))

  for (const worseItemIds of betterToWorse.values()) {
    for (const worseItemId of worseItemIds) {
      const currentCount = incomingEdgeCount.get(worseItemId)
      if (currentCount === undefined) {
        return null
      }
      incomingEdgeCount.set(worseItemId, currentCount + 1)
    }
  }

  const availableItemIds = items
    .filter((item) => incomingEdgeCount.get(item.id) === 0)
    .map((item) => item.id)
  const orderedItems: RankingItem[] = []

  while (orderedItems.length < items.length) {
    if (availableItemIds.length !== 1) {
      return null
    }

    const currentId = availableItemIds.pop()
    if (currentId === undefined) {
      return null
    }

    const currentItem = itemById.get(currentId)
    if (currentItem === undefined) {
      return null
    }
    orderedItems.push(currentItem)

    for (const worseItemId of getNeighbors(betterToWorse, currentId)) {
      const currentCount = incomingEdgeCount.get(worseItemId)
      if (currentCount === undefined || currentCount === 0) {
        return null
      }

      const nextCount = currentCount - 1
      incomingEdgeCount.set(worseItemId, nextCount)
      if (nextCount === 0) {
        availableItemIds.push(worseItemId)
      }
    }
  }

  return orderedItems
}

function buildPreferenceAdjacency(
  items: readonly RankingItem[],
  decisions: readonly RankingDecision[],
): Map<string, Set<string>> {
  const adjacency = new Map(
    items.map((item): [string, Set<string>] => [item.id, new Set()]),
  )

  for (const decision of decisions) {
    const worseItemIds = adjacency.get(decision.betterItemId)
    if (
      worseItemIds === undefined ||
      !adjacency.has(decision.worseItemId) ||
      decision.betterItemId === decision.worseItemId
    ) {
      continue
    }
    worseItemIds.add(decision.worseItemId)
  }

  return adjacency
}

function addNeighbor(
  neighbors: Map<string, Set<string>>,
  itemId: string,
  neighborId: string,
): void {
  let itemNeighbors = neighbors.get(itemId)
  itemNeighbors ??= new Set()
  neighbors.set(itemId, itemNeighbors)
  itemNeighbors.add(neighborId)
}

function getNeighbors(
  adjacency: ReadonlyMap<string, ReadonlySet<string>>,
  itemId: string,
): ReadonlySet<string> {
  return adjacency.get(itemId) ?? new Set()
}
