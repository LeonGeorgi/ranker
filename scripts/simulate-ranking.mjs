const DEFAULT_ITEM_COUNTS = [5, 10, 20, 30, 50, 100]
const DEFAULT_TRIAL_COUNT = 100_000
const DEFAULT_SEED = 20_260_730

function readPositiveIntegerOption(name, fallback) {
  const prefix = `--${name}=`
  const rawValue = process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length)

  if (rawValue === undefined) {
    return fallback
  }

  const value = Number(rawValue)

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`--${name} muss eine positive ganze Zahl sein.`)
  }

  return value
}

function readItemCounts() {
  const prefix = '--lengths='
  const rawValue = process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length)

  if (rawValue === undefined) {
    return DEFAULT_ITEM_COUNTS
  }

  const itemCounts = rawValue.split(',').map(Number)

  if (
    itemCounts.length === 0 ||
    itemCounts.some((itemCount) => !Number.isSafeInteger(itemCount) || itemCount < 2)
  ) {
    throw new Error('--lengths muss eine kommaseparierte Liste ganzer Zahlen ab 2 sein.')
  }

  return itemCounts
}

function createRandomNumberGenerator(seed) {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

function resetSequence(sequence) {
  for (let index = 0; index < sequence.length; index += 1) {
    sequence[index] = index
  }
}

function shuffle(sequence, random) {
  for (let index = sequence.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(random() * (index + 1))
    const value = sequence[index]
    sequence[index] = sequence[otherIndex]
    sequence[otherIndex] = value
  }
}

function mergeSortAndCount(
  itemIds,
  scratch,
  rankByItemId,
  comparisonEdges,
  trialMarker,
  start = 0,
  end = itemIds.length,
) {
  if (end - start <= 1) {
    return 0
  }

  const middle = start + Math.floor((end - start) / 2)
  let comparisonCount =
    mergeSortAndCount(
      itemIds,
      scratch,
      rankByItemId,
      comparisonEdges,
      trialMarker,
      start,
      middle,
    ) +
    mergeSortAndCount(
      itemIds,
      scratch,
      rankByItemId,
      comparisonEdges,
      trialMarker,
      middle,
      end,
    )
  let leftIndex = start
  let rightIndex = middle
  let targetIndex = start

  while (leftIndex < middle && rightIndex < end) {
    const leftItemId = itemIds[leftIndex]
    const rightItemId = itemIds[rightIndex]
    comparisonCount += 1

    if (rankByItemId[leftItemId] < rankByItemId[rightItemId]) {
      scratch[targetIndex] = leftItemId
      comparisonEdges[leftItemId * itemIds.length + rightItemId] = trialMarker
      leftIndex += 1
    } else {
      scratch[targetIndex] = rightItemId
      comparisonEdges[rightItemId * itemIds.length + leftItemId] = trialMarker
      rightIndex += 1
    }

    targetIndex += 1
  }

  while (leftIndex < middle) {
    scratch[targetIndex] = itemIds[leftIndex]
    leftIndex += 1
    targetIndex += 1
  }

  while (rightIndex < end) {
    scratch[targetIndex] = itemIds[rightIndex]
    rightIndex += 1
    targetIndex += 1
  }

  itemIds.set(scratch.subarray(start, end), start)

  return comparisonCount
}

function assertRankingWasRecovered(hiddenRanking, recoveredRanking) {
  for (let index = 0; index < hiddenRanking.length; index += 1) {
    if (hiddenRanking[index] !== recoveredRanking[index]) {
      throw new Error('Die verborgene Rangfolge wurde nicht korrekt rekonstruiert.')
    }
  }
}

function assertComparisonGraphHasUniqueRanking(hiddenRanking, comparisonEdges, trialMarker) {
  const itemCount = hiddenRanking.length

  for (let index = 0; index < itemCount - 1; index += 1) {
    const betterItemId = hiddenRanking[index]
    const worseItemId = hiddenRanking[index + 1]

    if (comparisonEdges[betterItemId * itemCount + worseItemId] !== trialMarker) {
      throw new Error('Der Vergleichsgraph bestimmt keine eindeutige Rangfolge.')
    }
  }
}

function expectedMergeComparisonCount(leftLength, rightLength) {
  return (
    leftLength +
    rightLength -
    leftLength / (rightLength + 1) -
    rightLength / (leftLength + 1)
  )
}

const expectedComparisonCountCache = new Map([
  [0, 0],
  [1, 0],
])

function expectedComparisonCount(itemCount) {
  const cachedValue = expectedComparisonCountCache.get(itemCount)

  if (cachedValue !== undefined) {
    return cachedValue
  }

  const leftLength = Math.floor(itemCount / 2)
  const rightLength = itemCount - leftLength
  const expectedCount =
    expectedComparisonCount(leftLength) +
    expectedComparisonCount(rightLength) +
    expectedMergeComparisonCount(leftLength, rightLength)
  expectedComparisonCountCache.set(itemCount, expectedCount)

  return expectedCount
}

function worstCaseComparisonCount(itemCount) {
  const levelCount = Math.ceil(Math.log2(itemCount))
  return itemCount * levelCount - 2 ** levelCount + 1
}

function informationLowerBound(itemCount) {
  let result = 0

  for (let value = 2; value <= itemCount; value += 1) {
    result += Math.log2(value)
  }

  return result
}

function nearestRankPercentile(sortedValues, percentile) {
  const index = Math.max(0, Math.ceil(percentile * sortedValues.length) - 1)
  return sortedValues[index]
}

function simulateItemCount(itemCount, trialCount, random) {
  const hiddenRanking = new Uint32Array(itemCount)
  const processingOrder = new Uint32Array(itemCount)
  const scratch = new Uint32Array(itemCount)
  const rankByItemId = new Uint32Array(itemCount)
  const comparisonEdges = new Uint32Array(itemCount * itemCount)
  const observedCounts = new Uint32Array(trialCount)
  let sum = 0
  let squaredSum = 0

  for (let trialIndex = 0; trialIndex < trialCount; trialIndex += 1) {
    resetSequence(hiddenRanking)
    resetSequence(processingOrder)
    shuffle(hiddenRanking, random)
    shuffle(processingOrder, random)

    for (let rank = 0; rank < itemCount; rank += 1) {
      rankByItemId[hiddenRanking[rank]] = rank
    }

    const trialMarker = trialIndex + 1
    const comparisonCount = mergeSortAndCount(
      processingOrder,
      scratch,
      rankByItemId,
      comparisonEdges,
      trialMarker,
    )
    assertRankingWasRecovered(hiddenRanking, processingOrder)
    assertComparisonGraphHasUniqueRanking(hiddenRanking, comparisonEdges, trialMarker)

    observedCounts[trialIndex] = comparisonCount
    sum += comparisonCount
    squaredSum += comparisonCount ** 2
  }

  observedCounts.sort()
  const mean = sum / trialCount
  const variance = Math.max(0, squaredSum / trialCount - mean ** 2)
  const standardDeviation = Math.sqrt(variance)

  return {
    itemCount,
    mean,
    confidenceIntervalRadius: (1.96 * standardDeviation) / Math.sqrt(trialCount),
    exactMean: expectedComparisonCount(itemCount),
    median: nearestRankPercentile(observedCounts, 0.5),
    percentile05: nearestRankPercentile(observedCounts, 0.05),
    percentile95: nearestRankPercentile(observedCounts, 0.95),
    observedMinimum: observedCounts[0],
    observedMaximum: observedCounts.at(-1),
    worstCase: worstCaseComparisonCount(itemCount),
    lowerBound: informationLowerBound(itemCount),
  }
}

function printResults(results, trialCount, seed) {
  console.log(`Monte-Carlo-Simulation: ${trialCount.toLocaleString('de-DE')} Läufe je Länge, Seed ${seed}`)
  console.log(
    'Der Zufalls-Scheduler darf unabhängige Merge-Schritte umsortieren; die Vergleichszahl bleibt dadurch unverändert.',
  )
  console.log('')
  console.log(
    '| Items | Ø simuliert | 95%-KI des Ø | Ø exakt | Median | P05–P95 | Min–Max beobachtet | Maximum | log₂(n!) |',
  )
  console.log('| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |')

  for (const result of results) {
    console.log(
      `| ${result.itemCount} | ${result.mean.toFixed(2)} | ±${result.confidenceIntervalRadius.toFixed(2)} | ${result.exactMean.toFixed(2)} | ${result.median} | ${result.percentile05}–${result.percentile95} | ${result.observedMinimum}–${result.observedMaximum} | ${result.worstCase} | ${result.lowerBound.toFixed(2)} |`,
    )
  }
}

const trialCount = readPositiveIntegerOption('trials', DEFAULT_TRIAL_COUNT)
const seed = readPositiveIntegerOption('seed', DEFAULT_SEED)
const itemCounts = readItemCounts()
const random = createRandomNumberGenerator(seed)
const results = itemCounts.map((itemCount) => simulateItemCount(itemCount, trialCount, random))

printResults(results, trialCount, seed)
