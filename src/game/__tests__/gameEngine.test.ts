import { describe, expect, it } from 'vitest'
import type { Puzzle } from '../types'
import { createInitialGameState, submitGuess, toggleSelectItem } from '../gameEngine'

const fixturePuzzle: Puzzle = {
  version: 1,
  id: 'fixture',
  title: 'Fixture',
  items: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
    { id: 'c', text: 'C' },
    { id: 'd', text: 'D' },
    { id: 'e', text: 'E' },
    { id: 'f', text: 'F' },
    { id: 'g', text: 'G' },
    { id: 'h', text: 'H' },
    { id: 'i', text: 'I' },
    { id: 'j', text: 'J' },
    { id: 'k', text: 'K' },
    { id: 'l', text: 'L' },
    { id: 'm', text: 'M' },
    { id: 'n', text: 'N' },
    { id: 'o', text: 'O' },
    { id: 'p', text: 'P' },
  ],
  groups: [
    { id: 'g1', label: 'G1', color: 'yellow', itemIds: ['a', 'b', 'c', 'd'] },
    { id: 'g2', label: 'G2', color: 'green', itemIds: ['e', 'f', 'g', 'h'] },
    { id: 'g3', label: 'G3', color: 'blue', itemIds: ['i', 'j', 'k', 'l'] },
    { id: 'g4', label: 'G4', color: 'purple', itemIds: ['m', 'n', 'o', 'p'] },
  ],
}

describe('gameEngine', () => {
  it('is deterministic for the same seedKey', () => {
    const s1 = createInitialGameState({ puzzle: fixturePuzzle, seedKey: 'seed-1' })
    const s2 = createInitialGameState({ puzzle: fixturePuzzle, seedKey: 'seed-1' })
    expect(s1.boardItemIds).toEqual(s2.boardItemIds)
    expect(s1.seed).toEqual(s2.seed)
  })

  it('finds a correct group and eventually wins', () => {
    let s = createInitialGameState({ puzzle: fixturePuzzle, seedKey: 'seed-2' })

    for (const id of ['a', 'b', 'c', 'd']) s = toggleSelectItem(s, id)
    s = submitGuess(s)
    expect(s.foundGroupIds).toContain('g1')
    expect(s.status).toBe('playing')

    for (const id of ['e', 'f', 'g', 'h']) s = toggleSelectItem(s, id)
    s = submitGuess(s)
    for (const id of ['i', 'j', 'k', 'l']) s = toggleSelectItem(s, id)
    s = submitGuess(s)
    for (const id of ['m', 'n', 'o', 'p']) s = toggleSelectItem(s, id)
    s = submitGuess(s)

    expect(s.status).toBe('won')
  })

  it('increments mistakes on a wrong guess and loses when out', () => {
    let s = createInitialGameState({ puzzle: fixturePuzzle, seedKey: 'seed-3', mistakesAllowed: 2 })

    for (const id of ['a', 'b', 'c', 'e']) s = toggleSelectItem(s, id)
    s = submitGuess(s)
    expect(s.mistakesMade).toBe(1)
    expect(s.status).toBe('playing')

    for (const id of ['a', 'b', 'c', 'e']) s = toggleSelectItem(s, id)
    s = submitGuess(s)
    expect(s.mistakesMade).toBe(2)
    expect(s.status).toBe('lost')
  })
})

