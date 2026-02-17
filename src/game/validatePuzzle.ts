import type { Puzzle, PuzzleGroup, PuzzleItem } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function assertString(value: unknown, label: string): string {
  if (!isString(value) || value.trim().length === 0) {
    throw new Error(`Invalid ${label}: expected non-empty string`)
  }
  return value
}

function assertItems(value: unknown): PuzzleItem[] {
  if (!Array.isArray(value)) throw new Error('Invalid items: expected array')
  return value.map((v, idx) => {
    if (!isRecord(v)) throw new Error(`Invalid items[${idx}]: expected object`)
    return {
      id: assertString(v.id, `items[${idx}].id`),
      text: assertString(v.text, `items[${idx}].text`),
    }
  })
}

function assertGroups(value: unknown): PuzzleGroup[] {
  if (!Array.isArray(value)) throw new Error('Invalid groups: expected array')
  return value.map((v, idx) => {
    if (!isRecord(v)) throw new Error(`Invalid groups[${idx}]: expected object`)

    const itemIds = v.itemIds
    if (!Array.isArray(itemIds) || itemIds.length !== 4 || !itemIds.every(isString)) {
      throw new Error(`Invalid groups[${idx}].itemIds: expected string[4]`)
    }

    const color = assertString(v.color, `groups[${idx}].color`)
    if (color !== 'yellow' && color !== 'green' && color !== 'blue' && color !== 'purple') {
      throw new Error(`Invalid groups[${idx}].color: expected yellow|green|blue|purple`)
    }

    return {
      id: assertString(v.id, `groups[${idx}].id`),
      label: assertString(v.label, `groups[${idx}].label`),
      color,
      itemIds: [itemIds[0], itemIds[1], itemIds[2], itemIds[3]],
    }
  })
}

export function assertPuzzle(raw: unknown): Puzzle {
  if (!isRecord(raw)) throw new Error('Invalid puzzle: expected object')
  const version = raw.version
  if (version !== 1) throw new Error('Invalid puzzle.version: expected 1')

  const puzzle: Puzzle = {
    version: 1,
    id: assertString(raw.id, 'puzzle.id'),
    title: assertString(raw.title, 'puzzle.title'),
    date: isString(raw.date) ? raw.date : undefined,
    items: assertItems(raw.items),
    groups: assertGroups(raw.groups),
  }

  // Semantic validation
  if (puzzle.items.length !== 16) throw new Error('Invalid puzzle.items: expected length 16')
  if (puzzle.groups.length !== 4) throw new Error('Invalid puzzle.groups: expected length 4')

  const itemIdSet = new Set<string>()
  for (const item of puzzle.items) {
    if (itemIdSet.has(item.id)) throw new Error(`Duplicate item id: ${item.id}`)
    itemIdSet.add(item.id)
  }

  const covered = new Set<string>()
  for (const group of puzzle.groups) {
    for (const id of group.itemIds) {
      if (!itemIdSet.has(id)) throw new Error(`Group references unknown item id: ${id}`)
      if (covered.has(id)) throw new Error(`Item id used in multiple groups: ${id}`)
      covered.add(id)
    }
  }

  if (covered.size !== 16) {
    throw new Error('Invalid groups: expected groups to cover all 16 items exactly once')
  }

  return puzzle
}

