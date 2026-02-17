export type GroupColor = 'yellow' | 'green' | 'blue' | 'purple'

export interface PuzzleItem {
  /** Stable, unique ID for the item within this puzzle. */
  id: string
  /** The text shown on the tile. */
  text: string
}

export interface PuzzleGroup {
  id: string
  /**
   * Category label. Should be somewhat oblique; the UI hides it until the group is found.
   */
  label: string
  color: GroupColor
  /**
   * The 4 item IDs that make up this category.
   * Stored as a tuple to enforce exact cardinality.
   */
  itemIds: [string, string, string, string]
}

export interface PuzzleV1 {
  version: 1
  id: string
  title: string
  /**
   * Optional date key for daily puzzles (YYYY-MM-DD).
   */
  date?: string
  items: PuzzleItem[]
  groups: PuzzleGroup[]
}

export type Puzzle = PuzzleV1

export type GameStatus = 'playing' | 'won' | 'lost'

export interface GameState {
  puzzle: Puzzle
  seed: number
  /**
   * The current board order. Items are addressed by ID for stability.
   */
  boardItemIds: string[]
  selectedItemIds: string[]
  foundGroupIds: string[]
  mistakesMade: number
  mistakesAllowed: number
  status: GameStatus
  /**
   * Short-lived feedback for the last action (e.g., correct/wrong).
   */
  lastMessage?: string
  /**
   * If the last submit was correct, this is the group that was found.
   */
  lastFoundGroupId?: string
}

