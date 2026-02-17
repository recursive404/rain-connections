import type { GameState, Puzzle } from './types'
import { hashStringToSeed, mulberry32, shuffleStable } from './prng'

export const DEFAULT_MISTAKES_ALLOWED = 4

function setEquals(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  const s = new Set(a)
  for (const v of b) if (!s.has(v)) return false
  return true
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

export function submitGuess(state: GameState): GameState {
  if (state.status !== 'playing') return state
  if (state.selectedItemIds.length !== 4) {
    return { ...state, lastMessage: 'Select 4 tiles.' }
  }

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
    }
  }

  const mistakesMade = state.mistakesMade + 1
  const lost = mistakesMade >= state.mistakesAllowed
  return {
    ...state,
    mistakesMade,
    selectedItemIds: [],
    status: lost ? 'lost' : 'playing',
    lastMessage: lost ? 'Out of guesses.' : 'Nope.',
    lastFoundGroupId: undefined,
  }
}

