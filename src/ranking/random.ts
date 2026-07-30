const UINT32_RANGE = 0x1_0000_0000
const MULBERRY_INCREMENT = 0x6d2b_79f5

export interface RandomState {
  readonly value: number
}

export interface RandomSample {
  readonly value: number
  readonly state: RandomState
}

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed) || !Number.isInteger(seed)) {
    throw new TypeError('The ranking seed must be a finite integer.')
  }

  return seed >>> 0
}

export function createRandomState(seed: number): RandomState {
  return { value: normalizeSeed(seed) }
}

/** A small deterministic PRNG whose single uint32 state is JSON-safe. */
export function nextRandom(state: RandomState): RandomSample {
  const nextStateValue = (state.value + MULBERRY_INCREMENT) >>> 0
  let mixed = nextStateValue
  mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
  const unsignedValue = (mixed ^ (mixed >>> 14)) >>> 0

  return {
    value: unsignedValue / UINT32_RANGE,
    state: { value: nextStateValue },
  }
}
