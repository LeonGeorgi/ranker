import {
  buildRankingGraph,
  countDeterminedPairs,
  countVisibleComponents,
  getUniqueRanking,
} from './graph.ts'
import {
  createRandomState,
  nextRandom,
  normalizeSeed,
  type RandomState,
} from './random.ts'
import {
  MAX_RANKING_ITEMS,
  MAX_RANKING_LABEL_LENGTH,
  RANKING_SESSION_VERSION,
  type ComparisonKind,
  type RankingDecision,
  type RankingItem,
  type RankingProgress,
  type RankingQuestion,
  type RankingSession,
  type RankingSnapshot,
} from './types.ts'

const MAX_UINT32 = 0xffff_ffff
const MIN_DISCOVERY_PROBABILITY = 0.2
const MAX_DISCOVERY_PROBABILITY = 0.65
const RECENT_ITEM_PENALTY = 0.15
const NEAR_RECENT_ITEM_PENALTY = 0.5

export type RankingSessionErrorCode =
  | 'invalid-items'
  | 'invalid-session'
  | 'ranking-complete'
  | 'invalid-choice'
  | 'stale-question'

export class RankingSessionError extends Error {
  readonly code: RankingSessionErrorCode

  constructor(code: RankingSessionErrorCode, message: string) {
    super(message)
    this.name = 'RankingSessionError'
    this.code = code
  }
}

interface LeafNodeDefinition {
  readonly kind: 'leaf'
  readonly id: string
  readonly itemId: string
  readonly size: 1
}

interface MergeNodeDefinition {
  readonly kind: 'merge'
  readonly id: string
  readonly left: MergeTreeNode
  readonly right: MergeTreeNode
  readonly size: number
}

type MergeTreeNode = LeafNodeDefinition | MergeNodeDefinition

interface MergeTaskState {
  readonly node: MergeNodeDefinition
  outputItemIds: string[]
  leftIndex: number
  rightIndex: number
  readyAtDecision: number | null
  startedAtDecision: number | null
  lastComparedAtDecision: number | null
  isComplete: boolean
}

interface RankingRuntime {
  readonly rootNodeId: string
  readonly tasks: MergeTaskState[]
  readonly nodeRuns: Map<string, readonly string[]>
  readonly visibleItemIds: Set<string>
  readonly lastSeenAtDecision: Map<string, number>
  readonly appliedDecisions: RankingDecision[]
  randomState: RandomState
}

interface TaskCandidate {
  readonly task: MergeTaskState
  readonly leftRunItemId: string
  readonly rightRunItemId: string
  readonly kind: ComparisonKind
}

interface ScheduledComparison extends TaskCandidate {
  readonly displayLeftItemId: string
  readonly displayRightItemId: string
  readonly introducedItemIds: readonly string[]
}

interface ReplayResult {
  readonly runtime: RankingRuntime
  readonly scheduledComparison: ScheduledComparison | null
}

export function createRankingSession(
  sourceLabels: readonly string[],
  seed: number,
): RankingSession {
  const labels = sourceLabels.map((label) => label.trim()).filter(Boolean)
  validateLabels(labels)

  return {
    version: RANKING_SESSION_VERSION,
    seed: normalizeSeed(seed),
    items: labels.map((label, index) => ({
      id: `ranking-item-${index + 1}`,
      label,
    })),
    decisions: [],
  }
}

export function deriveRankingSnapshot(
  session: RankingSession,
): RankingSnapshot {
  assertValidSessionBase(session)
  const { runtime, scheduledComparison } = replaySession(session)
  const graph = buildRankingGraph(session.items, session.decisions)
  const mergeIsComplete = runtime.nodeRuns.has(runtime.rootNodeId)
  const uniqueRanking = getUniqueRanking(session.items, session.decisions)

  if (mergeIsComplete && uniqueRanking === null) {
    throw new RankingSessionError(
      'invalid-session',
      'The completed merge does not define a unique ranking.',
    )
  }

  const currentQuestion =
    scheduledComparison === null
      ? null
      : buildRankingQuestion(
          scheduledComparison,
          session.items,
          session.decisions.length,
        )
  const totalPairCount = (session.items.length * (session.items.length - 1)) / 2
  const determinedPairCount = countDeterminedPairs(
    session.items,
    session.decisions,
  )
  const progress: RankingProgress = {
    totalItemCount: session.items.length,
    visibleItemCount: graph.nodes.length,
    remainingItemCount: session.items.length - graph.nodes.length,
    decisionCount: session.decisions.length,
    connectedComponentCount: countVisibleComponents(session.decisions),
    completedMergeCount: runtime.tasks.filter((task) => task.isComplete).length,
    totalMergeCount: runtime.tasks.length,
    determinedPairCount,
    totalPairCount,
    determinedFraction:
      totalPairCount === 0 ? 1 : determinedPairCount / totalPairCount,
    maximumDecisionCount: getMaximumDecisionCount(session.items.length),
    isComplete: mergeIsComplete,
  }

  return {
    currentQuestion,
    graph,
    progress,
    finalRanking: mergeIsComplete ? uniqueRanking : null,
  }
}

export function answerRankingQuestion(
  session: RankingSession,
  preferredItemId: string,
  expectedQuestionId: string,
): RankingSession {
  const snapshot = deriveRankingSnapshot(session)
  const question = snapshot.currentQuestion

  if (question === null) {
    throw new RankingSessionError(
      'ranking-complete',
      'The ranking is already complete.',
    )
  }

  if (question.id !== expectedQuestionId) {
    throw new RankingSessionError(
      'stale-question',
      'The answer belongs to a comparison that is no longer current.',
    )
  }

  if (
    preferredItemId !== question.left.id &&
    preferredItemId !== question.right.id
  ) {
    throw new RankingSessionError(
      'invalid-choice',
      'The preferred item must be one of the current comparison choices.',
    )
  }

  const worseItemId =
    preferredItemId === question.left.id ? question.right.id : question.left.id

  return {
    ...session,
    decisions: [
      ...session.decisions,
      {
        betterItemId: preferredItemId,
        worseItemId,
      },
    ],
  }
}

export function undoLastRankingDecision(
  session: RankingSession,
): RankingSession {
  if (session.decisions.length === 0) {
    return session
  }

  return {
    ...session,
    decisions: session.decisions.slice(0, -1),
  }
}

export function serializeRankingSession(session: RankingSession): string {
  deriveRankingSnapshot(session)
  return JSON.stringify(session)
}

export function deserializeRankingSession(
  serializedSession: string,
): RankingSession | null {
  try {
    const parsedSession: unknown = JSON.parse(serializedSession)
    return parseRankingSession(parsedSession)
  } catch {
    return null
  }
}

export function parseRankingSession(value: unknown): RankingSession | null {
  if (!isRecord(value)) {
    return null
  }

  const { version, seed, items: itemValues, decisions: decisionValues } = value
  if (
    version !== RANKING_SESSION_VERSION ||
    !isUint32(seed) ||
    !Array.isArray(itemValues) ||
    !Array.isArray(decisionValues)
  ) {
    return null
  }

  const items: RankingItem[] = []
  for (const itemValue of itemValues) {
    if (!isRecord(itemValue)) {
      return null
    }

    const { id, label } = itemValue
    if (
      typeof id !== 'string' ||
      id.length === 0 ||
      typeof label !== 'string' ||
      label.trim().length === 0
    ) {
      return null
    }
    items.push({ id, label })
  }

  const decisions: RankingDecision[] = []
  for (const decisionValue of decisionValues) {
    if (!isRecord(decisionValue)) {
      return null
    }

    const { betterItemId, worseItemId } = decisionValue
    if (
      typeof betterItemId !== 'string' ||
      typeof worseItemId !== 'string' ||
      betterItemId === worseItemId
    ) {
      return null
    }
    decisions.push({ betterItemId, worseItemId })
  }

  const session: RankingSession = {
    version: RANKING_SESSION_VERSION,
    seed,
    items,
    decisions,
  }

  try {
    assertValidSessionBase(session)
    if (decisions.length > getMaximumDecisionCount(items.length)) {
      return null
    }
    deriveRankingSnapshot(session)
    return session
  } catch {
    return null
  }
}

export function getMaximumDecisionCount(itemCount: number): number {
  if (itemCount <= 1) {
    return 0
  }

  const treeHeight = Math.ceil(Math.log2(itemCount))
  return itemCount * treeHeight - 2 ** treeHeight + 1
}

/** Exact mean for a balanced merge of a uniformly shuffled strict total order. */
export function getExpectedDecisionCount(itemCount: number): number {
  if (!Number.isSafeInteger(itemCount) || itemCount < 0) {
    throw new TypeError('The ranking item count must be a non-negative integer.')
  }

  return calculateExpectedDecisionCount(itemCount)
}

function calculateExpectedDecisionCount(itemCount: number): number {
  if (itemCount <= 1) {
    return 0
  }

  const leftItemCount = Math.floor(itemCount / 2)
  const rightItemCount = itemCount - leftItemCount
  const expectedMergeDecisionCount =
    itemCount -
    leftItemCount / (rightItemCount + 1) -
    rightItemCount / (leftItemCount + 1)

  return (
    calculateExpectedDecisionCount(leftItemCount) +
    calculateExpectedDecisionCount(rightItemCount) +
    expectedMergeDecisionCount
  )
}

function replaySession(session: RankingSession): ReplayResult {
  const runtime = createRuntime(session)

  for (const [decisionIndex, decision] of session.decisions.entries()) {
    const scheduledComparison = scheduleNextComparison(
      runtime,
      session.items.length,
    )
    if (scheduledComparison === null) {
      throw new RankingSessionError(
        'invalid-session',
        'The session contains decisions after the ranking was completed.',
      )
    }

    assertDecisionMatchesComparison(decision, scheduledComparison)
    applyDecision(runtime, scheduledComparison, decision, decisionIndex)
  }

  const scheduledComparison = runtime.nodeRuns.has(runtime.rootNodeId)
    ? null
    : scheduleNextComparison(runtime, session.items.length)

  if (
    scheduledComparison === null &&
    !runtime.nodeRuns.has(runtime.rootNodeId)
  ) {
    throw new RankingSessionError(
      'invalid-session',
      'The ranking scheduler has no eligible comparison.',
    )
  }

  return { runtime, scheduledComparison }
}

function createRuntime(session: RankingSession): RankingRuntime {
  const shuffledResult = shuffleItemIds(
    session.items.map((item) => item.id),
    createRandomState(session.seed),
  )
  const rootNode = buildMergeTree(shuffledResult.itemIds, 'root')
  const tasks: MergeTaskState[] = []
  const nodeRuns = new Map<string, readonly string[]>()
  registerTree(rootNode, tasks, nodeRuns)

  return {
    rootNodeId: rootNode.id,
    tasks,
    nodeRuns,
    visibleItemIds: new Set(),
    lastSeenAtDecision: new Map(),
    appliedDecisions: [],
    randomState: shuffledResult.randomState,
  }
}

function buildMergeTree(
  itemIds: readonly string[],
  path: string,
): MergeTreeNode {
  if (itemIds.length === 1) {
    const itemId = itemIds[0]
    if (itemId === undefined) {
      throwInvalidSession('A ranking tree leaf is missing its item.')
    }
    return { kind: 'leaf', id: `leaf-${path}`, itemId, size: 1 }
  }

  if (itemIds.length === 0) {
    throwInvalidSession('A ranking tree cannot contain an empty branch.')
  }

  const midpoint = Math.floor(itemIds.length / 2)
  const left = buildMergeTree(itemIds.slice(0, midpoint), `${path}-left`)
  const right = buildMergeTree(itemIds.slice(midpoint), `${path}-right`)

  return {
    kind: 'merge',
    id: `merge-${path}`,
    left,
    right,
    size: itemIds.length,
  }
}

function registerTree(
  node: MergeTreeNode,
  tasks: MergeTaskState[],
  nodeRuns: Map<string, readonly string[]>,
): void {
  if (node.kind === 'leaf') {
    nodeRuns.set(node.id, [node.itemId])
    return
  }

  registerTree(node.left, tasks, nodeRuns)
  registerTree(node.right, tasks, nodeRuns)
  tasks.push({
    node,
    outputItemIds: [],
    leftIndex: 0,
    rightIndex: 0,
    readyAtDecision: null,
    startedAtDecision: null,
    lastComparedAtDecision: null,
    isComplete: false,
  })
}

function scheduleNextComparison(
  runtime: RankingRuntime,
  totalItemCount: number,
): ScheduledComparison | null {
  const candidates = collectCandidates(runtime)
  if (candidates.length === 0) {
    return null
  }

  const discoveryCandidates = candidates.filter(
    (candidate) => candidate.kind === 'discovery-pair',
  )
  const mergeCandidates = candidates.filter(
    (candidate) => candidate.kind === 'merge',
  )
  const selectedCandidate = selectWeightedCandidate(
    candidates,
    runtime,
    discoveryCandidates.length,
    mergeCandidates.length,
    totalItemCount,
  )
  const orientationSample = nextRandom(runtime.randomState)
  runtime.randomState = orientationSample.state
  const shouldSwapSides = orientationSample.value < 0.5
  const displayLeftItemId = shouldSwapSides
    ? selectedCandidate.rightRunItemId
    : selectedCandidate.leftRunItemId
  const displayRightItemId = shouldSwapSides
    ? selectedCandidate.leftRunItemId
    : selectedCandidate.rightRunItemId
  const introducedItemIds = [displayLeftItemId, displayRightItemId].filter(
    (itemId) => !runtime.visibleItemIds.has(itemId),
  )

  return {
    ...selectedCandidate,
    displayLeftItemId,
    displayRightItemId,
    introducedItemIds,
  }
}

function collectCandidates(runtime: RankingRuntime): TaskCandidate[] {
  const decisionCount = runtime.appliedDecisions.length
  const candidates: TaskCandidate[] = []

  for (const task of runtime.tasks) {
    if (task.isComplete) {
      continue
    }

    const leftRun = runtime.nodeRuns.get(task.node.left.id)
    const rightRun = runtime.nodeRuns.get(task.node.right.id)
    if (leftRun === undefined || rightRun === undefined) {
      continue
    }

    task.readyAtDecision ??= decisionCount

    const leftRunItemId = leftRun[task.leftIndex]
    const rightRunItemId = rightRun[task.rightIndex]
    if (leftRunItemId === undefined || rightRunItemId === undefined) {
      throwInvalidSession('An unfinished merge has no comparison candidates.')
    }

    const isUnseenLeafPair =
      task.node.size === 2 &&
      task.startedAtDecision === null &&
      !runtime.visibleItemIds.has(leftRunItemId) &&
      !runtime.visibleItemIds.has(rightRunItemId)

    candidates.push({
      task,
      leftRunItemId,
      rightRunItemId,
      kind: isUnseenLeafPair ? 'discovery-pair' : 'merge',
    })
  }

  return candidates
}

function selectWeightedCandidate(
  candidates: readonly TaskCandidate[],
  runtime: RankingRuntime,
  discoveryCandidateCount: number,
  mergeCandidateCount: number,
  totalItemCount: number,
): TaskCandidate {
  const firstCandidate = candidates[0]
  if (firstCandidate === undefined) {
    throwInvalidSession('A scheduler category has no comparison candidates.')
  }
  if (candidates.length === 1) {
    return firstCandidate
  }

  const hasBothCategories =
    discoveryCandidateCount > 0 && mergeCandidateCount > 0
  const discoveryCategoryWeight = hasBothCategories
    ? getDiscoveryProbability(runtime, totalItemCount)
    : discoveryCandidateCount > 0
      ? 1
      : 0
  const mergeCategoryWeight = 1 - discoveryCategoryWeight
  const weightedCandidates = candidates.map((candidate) => {
    const categoryCandidateCount =
      candidate.kind === 'discovery-pair'
        ? discoveryCandidateCount
        : mergeCandidateCount
    const categoryWeight =
      candidate.kind === 'discovery-pair'
        ? discoveryCategoryWeight
        : mergeCategoryWeight

    return {
      candidate,
      // Dividing by category size prevents a large pool of unseen pairs from
      // overwhelming the intended discovery-versus-merge distribution.
      weight:
        (categoryWeight / categoryCandidateCount) *
        getCandidateWeight(candidate, runtime),
    }
  })
  const totalWeight = weightedCandidates.reduce(
    (sum, weightedCandidate) => sum + weightedCandidate.weight,
    0,
  )
  const selectionSample = nextRandom(runtime.randomState)
  runtime.randomState = selectionSample.state
  const targetWeight = selectionSample.value * totalWeight
  let cumulativeWeight = 0

  for (const weightedCandidate of weightedCandidates) {
    cumulativeWeight += weightedCandidate.weight
    if (targetWeight < cumulativeWeight) {
      return weightedCandidate.candidate
    }
  }

  const finalCandidate = weightedCandidates.at(-1)
  if (finalCandidate === undefined) {
    throwInvalidSession('The weighted scheduler failed to select a comparison.')
  }
  return finalCandidate.candidate
}

function getCandidateWeight(
  candidate: TaskCandidate,
  runtime: RankingRuntime,
): number {
  const decisionCount = runtime.appliedDecisions.length
  const recencyMultiplier = Math.min(
    getItemRecencyMultiplier(
      candidate.leftRunItemId,
      runtime.lastSeenAtDecision,
      decisionCount,
    ),
    getItemRecencyMultiplier(
      candidate.rightRunItemId,
      runtime.lastSeenAtDecision,
      decisionCount,
    ),
  )
  const lastActiveAt =
    candidate.task.lastComparedAtDecision ??
    candidate.task.readyAtDecision ??
    decisionCount
  const waitingDecisionCount = Math.max(0, decisionCount - lastActiveAt)
  const waitingMultiplier = 1 + Math.min(waitingDecisionCount / 8, 1.5)
  const activeMergeMultiplier =
    candidate.task.startedAtDecision === null ? 1 : 1.15

  return recencyMultiplier * waitingMultiplier * activeMergeMultiplier
}

function getItemRecencyMultiplier(
  itemId: string,
  lastSeenAtDecision: ReadonlyMap<string, number>,
  decisionCount: number,
): number {
  const lastSeen = lastSeenAtDecision.get(itemId)
  if (lastSeen === undefined) {
    return 1
  }

  const decisionDistance = decisionCount - lastSeen
  if (decisionDistance <= 1) {
    return RECENT_ITEM_PENALTY
  }
  if (decisionDistance <= 3) {
    return NEAR_RECENT_ITEM_PENALTY
  }
  return 1
}

function getDiscoveryProbability(
  runtime: RankingRuntime,
  totalItemCount: number,
): number {
  const unseenFraction =
    (totalItemCount - runtime.visibleItemIds.size) / totalItemCount
  const componentCount = countVisibleComponents(runtime.appliedDecisions)
  const componentPressure = Math.min(
    0.3,
    Math.max(0, componentCount - 2) * 0.06,
  )
  const probability =
    MIN_DISCOVERY_PROBABILITY + 0.45 * unseenFraction - componentPressure

  return Math.min(
    MAX_DISCOVERY_PROBABILITY,
    Math.max(MIN_DISCOVERY_PROBABILITY, probability),
  )
}

function applyDecision(
  runtime: RankingRuntime,
  comparison: ScheduledComparison,
  decision: RankingDecision,
  decisionIndex: number,
): void {
  const { task } = comparison
  task.startedAtDecision ??= decisionIndex
  task.lastComparedAtDecision = decisionIndex
  task.outputItemIds.push(decision.betterItemId)

  if (decision.betterItemId === comparison.leftRunItemId) {
    task.leftIndex += 1
  } else if (decision.betterItemId === comparison.rightRunItemId) {
    task.rightIndex += 1
  } else {
    throwInvalidSession('A decision does not belong to its scheduled merge.')
  }

  const leftRun = getNodeRun(runtime, task.node.left.id)
  const rightRun = getNodeRun(runtime, task.node.right.id)
  if (task.leftIndex === leftRun.length || task.rightIndex === rightRun.length) {
    task.outputItemIds.push(...leftRun.slice(task.leftIndex))
    task.outputItemIds.push(...rightRun.slice(task.rightIndex))

    if (task.outputItemIds.length !== task.node.size) {
      throwInvalidSession('A completed merge contains the wrong number of items.')
    }

    runtime.nodeRuns.set(task.node.id, [...task.outputItemIds])
    task.isComplete = true
  }

  runtime.visibleItemIds.add(decision.betterItemId)
  runtime.visibleItemIds.add(decision.worseItemId)
  runtime.lastSeenAtDecision.set(decision.betterItemId, decisionIndex)
  runtime.lastSeenAtDecision.set(decision.worseItemId, decisionIndex)
  runtime.appliedDecisions.push(decision)
}

function buildRankingQuestion(
  comparison: ScheduledComparison,
  items: readonly RankingItem[],
  completedDecisionCount: number,
): RankingQuestion {
  const itemById = new Map(items.map((item) => [item.id, item]))
  const left = itemById.get(comparison.displayLeftItemId)
  const right = itemById.get(comparison.displayRightItemId)
  if (left === undefined || right === undefined) {
    throwInvalidSession('A scheduled comparison references an unknown item.')
  }

  return {
    id: [
      `question-${completedDecisionCount + 1}`,
      comparison.task.node.id,
      comparison.displayLeftItemId,
      comparison.displayRightItemId,
    ].join(':'),
    decisionNumber: completedDecisionCount + 1,
    mergeId: comparison.task.node.id,
    kind: comparison.kind,
    left,
    right,
    introducedItemIds: comparison.introducedItemIds,
  }
}

function assertDecisionMatchesComparison(
  decision: RankingDecision,
  comparison: ScheduledComparison,
): void {
  const matchesScheduledPair =
    (decision.betterItemId === comparison.displayLeftItemId &&
      decision.worseItemId === comparison.displayRightItemId) ||
    (decision.betterItemId === comparison.displayRightItemId &&
      decision.worseItemId === comparison.displayLeftItemId)

  if (!matchesScheduledPair) {
    throwInvalidSession(
      'A stored decision does not match the deterministic comparison schedule.',
    )
  }
}

function shuffleItemIds(
  sourceItemIds: readonly string[],
  initialRandomState: RandomState,
): { readonly itemIds: readonly string[]; readonly randomState: RandomState } {
  const itemIds = [...sourceItemIds]
  let randomState = initialRandomState

  for (let index = itemIds.length - 1; index > 0; index -= 1) {
    const sample = nextRandom(randomState)
    randomState = sample.state
    const swapIndex = Math.floor(sample.value * (index + 1))
    const currentItemId = itemIds[index]
    const swapItemId = itemIds[swapIndex]
    if (currentItemId === undefined || swapItemId === undefined) {
      throwInvalidSession('The ranking shuffle selected an invalid item index.')
    }
    itemIds[index] = swapItemId
    itemIds[swapIndex] = currentItemId
  }

  return { itemIds, randomState }
}

function getNodeRun(
  runtime: RankingRuntime,
  nodeId: string,
): readonly string[] {
  const run = runtime.nodeRuns.get(nodeId)
  if (run === undefined) {
    throwInvalidSession('A merge started before both child runs were complete.')
  }
  return run
}

function validateLabels(labels: readonly string[]): void {
  if (labels.length < 2) {
    throw new RankingSessionError(
      'invalid-items',
      'A ranking needs at least two non-empty items.',
    )
  }
  if (labels.length > MAX_RANKING_ITEMS) {
    throw new RankingSessionError(
      'invalid-items',
      `A ranking supports at most ${MAX_RANKING_ITEMS} items.`,
    )
  }

  const normalizedLabels = new Set<string>()
  for (const label of labels) {
    if (label.length > MAX_RANKING_LABEL_LENGTH) {
      throw new RankingSessionError(
        'invalid-items',
        `A ranking item may contain at most ${MAX_RANKING_LABEL_LENGTH} characters.`,
      )
    }

    const normalizedLabel = label.toLocaleLowerCase('de-DE')
    if (normalizedLabels.has(normalizedLabel)) {
      throw new RankingSessionError(
        'invalid-items',
        `The ranking contains the duplicate item "${label}".`,
      )
    }
    normalizedLabels.add(normalizedLabel)
  }
}

function assertValidSessionBase(session: RankingSession): void {
  if (
    session.version !== RANKING_SESSION_VERSION ||
    !isUint32(session.seed)
  ) {
    throwInvalidSession('The ranking session has an unsupported format.')
  }

  validateLabels(session.items.map((item) => item.label))
  const itemIds = new Set<string>()
  for (const item of session.items) {
    if (
      item.id.length === 0 ||
      item.label.trim().length === 0 ||
      itemIds.has(item.id)
    ) {
      throwInvalidSession('The ranking session contains invalid items.')
    }
    itemIds.add(item.id)
  }

  for (const decision of session.decisions) {
    if (
      decision.betterItemId === decision.worseItemId ||
      !itemIds.has(decision.betterItemId) ||
      !itemIds.has(decision.worseItemId)
    ) {
      throwInvalidSession('The ranking session contains an invalid decision.')
    }
  }
}

function isUint32(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_UINT32
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function throwInvalidSession(message: string): never {
  throw new RankingSessionError('invalid-session', message)
}
