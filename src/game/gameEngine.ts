import type { GameState, GuessOutcome, Puzzle } from './types'
import { hashStringToSeed, mulberry32, shuffleStable } from './prng'

export const DEFAULT_MISTAKES_ALLOWED = 4
export const DEFAULT_CHECK_DELAY_MS = 650

function setEquals(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  const s = new Set(a)
  for (const v of b) if (!s.has(v)) return false
  return true
}

function intersectionSize(a: readonly string[], b: readonly string[]): number {
  const s = new Set(a)
  let n = 0
  for (const v of b) if (s.has(v)) n += 1
  return n
}

export function createInitialGameState(params: {
  puzzle: Puzzle
  /**
   * Any stable string (date, puzzle id, etc). If omitted, uses puzzle.id.
   */
  seedKey?: string
  mistakesAllowed?: number
}): GameState {
  const seedKey = params.seedKey ?? params.puzzle.date ?? params.puzzle.id
  const seed = hashStringToSeed(seedKey)
  const rng = mulberry32(seed)
  const boardItemIds = shuffleStable(
    params.puzzle.items.map((i) => i.id),
    rng,
  )

  return {
    puzzle: params.puzzle,
    seed,
    boardItemIds,
    selectedItemIds: [],
    foundGroupIds: [],
    mistakesMade: 0,
    mistakesAllowed: params.mistakesAllowed ?? DEFAULT_MISTAKES_ALLOWED,
    status: 'playing',
    shuffleCount: 0,
    guessHistory: [],
  }
}

export function toggleSelectItem(state: GameState, itemId: string): GameState {
  if (state.status !== 'playing') return state

  // Don’t allow selecting items that are already in a found group.
  for (const gid of state.foundGroupIds) {
    const group = state.puzzle.groups.find((g) => g.id === gid)
    if (group && group.itemIds.includes(itemId)) return state
  }

  const selected = state.selectedItemIds.includes(itemId)
  if (selected) {
    return {
      ...state,
      selectedItemIds: state.selectedItemIds.filter((id) => id !== itemId),
      lastMessage: undefined,
      lastFoundGroupId: undefined,
    }
  }

  if (state.selectedItemIds.length >= 4) return state

  return {
    ...state,
    selectedItemIds: [...state.selectedItemIds, itemId],
    lastMessage: undefined,
    lastFoundGroupId: undefined,
  }
}

export function clearSelection(state: GameState): GameState {
  if (state.status !== 'playing') return state
  return { ...state, selectedItemIds: [], lastMessage: undefined, lastFoundGroupId: undefined }
}

function isItemInFoundGroup(state: GameState, itemId: string): boolean {
  for (const gid of state.foundGroupIds) {
    const group = state.puzzle.groups.find((g) => g.id === gid)
    if (group && group.itemIds.includes(itemId)) return true
  }
  return false
}

export function shuffleRemainingTiles(state: GameState): GameState {
  if (state.status !== 'playing') return state

  const remaining = state.boardItemIds.filter((id) => !isItemInFoundGroup(state, id))
  const shuffleCount = state.shuffleCount + 1
  const rng = mulberry32(hashStringToSeed(`${state.seed}:${shuffleCount}`))
  const shuffled = shuffleStable(remaining, rng)

  let idx = 0
  const boardItemIds = state.boardItemIds.map((id) => {
    if (isItemInFoundGroup(state, id)) return id
    const next = shuffled[idx]
    idx += 1
    return next
  })

  return {
    ...state,
    shuffleCount,
    boardItemIds,
    lastMessage: undefined,
    lastFoundGroupId: undefined,
  }
}

export function submitGuess(state: GameState): GameState {
  if (state.status !== 'playing') return state
  if (state.selectedItemIds.length !== 4) {
    return { ...state, lastMessage: 'Select 4 tiles.' }
  }

  const selected: [string, string, string, string] = [
    state.selectedItemIds[0],
    state.selectedItemIds[1],
    state.selectedItemIds[2],
    state.selectedItemIds[3],
  ]

  const alreadyFound = state.foundGroupIds.some((gid) => {
    const group = state.puzzle.groups.find((g) => g.id === gid)
    return group ? setEquals(group.itemIds, state.selectedItemIds) : false
  })
  if (alreadyFound) {
    return { ...state, lastMessage: 'Already found.', selectedItemIds: [] }
  }

  const correctGroup = state.puzzle.groups.find(
    (g) => !state.foundGroupIds.includes(g.id) && setEquals(g.itemIds, state.selectedItemIds),
  )

  if (correctGroup) {
    const foundGroupIds = [...state.foundGroupIds, correctGroup.id]
    const won = foundGroupIds.length === state.puzzle.groups.length
    return {
      ...state,
      foundGroupIds,
      selectedItemIds: [],
      status: won ? 'won' : 'playing',
      lastMessage: won ? 'Solved!' : 'Correct.',
      lastFoundGroupId: correctGroup.id,
      guessHistory: [
        ...state.guessHistory,
        { turn: state.guessHistory.length + 1, itemIds: selected, outcome: 'correct', groupId: correctGroup.id },
      ],
    }
  }

  const maxOverlap = Math.max(
    ...state.puzzle.groups
      .filter((g) => !state.foundGroupIds.includes(g.id))
      .map((g) => intersectionSize(g.itemIds, state.selectedItemIds)),
  )

  const mistakesMade = state.mistakesMade + 1
  const lost = mistakesMade >= state.mistakesAllowed

  // Feedback rule: only notify when “one away” (3/4). Otherwise, do nothing.
  const oneAway = maxOverlap === 3
  const outcome: GuessOutcome = oneAway ? 'one_away' : 'wrong'

  const guessHistory = [
    ...state.guessHistory,
    { turn: state.guessHistory.length + 1, itemIds: selected, outcome },
  ]

  if (lost) {
    // Auto-solve: mark all groups as found so the UI shows the full solution.
    return {
      ...state,
      mistakesMade,
      selectedItemIds: [],
      status: 'lost',
      lastMessage: 'Out of guesses.',
      lastFoundGroupId: undefined,
      foundGroupIds: state.puzzle.groups.map((g) => g.id),
      guessHistory,
    }
  }

  return {
    ...state,
    mistakesMade,
    selectedItemIds: [],
    status: 'playing',
    lastMessage: oneAway ? 'One away…' : undefined,
    lastFoundGroupId: undefined,
    guessHistory,
  }
}
