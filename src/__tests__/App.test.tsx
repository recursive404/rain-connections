import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

const puzzle = {
  version: 1,
  id: 'puzzle-2026-02-17',
  title: 'First test puzzle',
  date: '2026-02-17',
  items: [
    { id: 'i1', text: 'Edamame' },
    { id: 'i2', text: 'Biscotti' },
    { id: 'i3', text: 'Jerky' },
    { id: 'i4', text: 'Pocky' },

    { id: 'i5', text: 'Closure' },
    { id: 'i6', text: 'Recursion' },
    { id: 'i7', text: 'Heap' },
    { id: 'i8', text: 'Stack' },

    { id: 'i9', text: 'Aurora' },
    { id: 'i10', text: 'Eclipse' },
    { id: 'i11', text: 'Geyser' },
    { id: 'i12', text: 'Tornado' },

    { id: 'i13', text: 'No Fail' },
    { id: 'i14', text: 'Ghost Notes' },
    { id: 'i15', text: 'Faster Song' },
    { id: 'i16', text: 'Disappearing Arrows' },
  ],
  groups: [
    { id: 'g-yellow', label: 'Snack aisle', color: 'yellow', itemIds: ['i1', 'i2', 'i3', 'i4'] },
    { id: 'g-green', label: 'Code vocabulary', color: 'green', itemIds: ['i5', 'i6', 'i7', 'i8'] },
    { id: 'g-blue', label: 'Nature puts on a show', color: 'blue', itemIds: ['i9', 'i10', 'i11', 'i12'] },
    { id: 'g-purple', label: 'VR rhythm toggles', color: 'purple', itemIds: ['i13', 'i14', 'i15', 'i16'] },
  ],
}

function mockFetch() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('2026-02-17')) {
      return new Response(JSON.stringify(puzzle), { status: 200 })
    }
    return new Response('not found', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('loads the puzzle and allows solving a group', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

    // Puzzle loads
    expect(await screen.findByTestId('tile-grid')).toBeInTheDocument()

    // Select the snack group
    await user.click(screen.getByTestId('tile-i1'))
    await user.click(screen.getByTestId('tile-i2'))
    await user.click(screen.getByTestId('tile-i3'))
    await user.click(screen.getByTestId('tile-i4'))
    await user.click(screen.getByTestId('submit-guess-button'))

    // Submit has a brief “checking” delay.
    expect(await screen.findByTestId('found-group-g-yellow')).toBeInTheDocument()
  })
})
