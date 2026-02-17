import './App.css'
import { useEffect, useMemo, useReducer } from 'react'
import { assertPuzzle, createInitialGameState, submitGuess, toggleSelectItem } from './game'
import type { GameState, GroupColor, PuzzleGroup, PuzzleItem } from './game'
import { Button } from './components/ui/button'
import { cn } from './lib/utils'
import { SettingsMenu } from './components/SettingsMenu'
import { applyTheme, getStoredTheme } from './theme/theme'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; game: GameState }

type Action =
  | { type: 'load_ok'; game: GameState }
  | { type: 'load_err'; message: string }
  | { type: 'toggle'; itemId: string }
  | { type: 'submit' }
  | { type: 'reset'; game: GameState }

function reducer(state: LoadState, action: Action): LoadState {
  if (state.kind !== 'ready') {
    if (action.type === 'load_ok') return { kind: 'ready', game: action.game }
    if (action.type === 'load_err') return { kind: 'error', message: action.message }
    return state
  }

  switch (action.type) {
    case 'toggle':
      return { kind: 'ready', game: toggleSelectItem(state.game, action.itemId) }
    case 'submit':
      return { kind: 'ready', game: submitGuess(state.game) }
    case 'reset':
      return { kind: 'ready', game: action.game }
    case 'load_ok':
      return { kind: 'ready', game: action.game }
    case 'load_err':
      return { kind: 'error', message: action.message }
    default:
      return state
  }
}

function colorToClass(color: GroupColor): string {
  switch (color) {
    case 'yellow':
      return 'group group-yellow'
    case 'green':
      return 'group group-green'
    case 'blue':
      return 'group group-blue'
    case 'purple':
      return 'group group-purple'
    default:
      return 'group'
  }
}

function getPuzzleDateKeyFromUrl(): string | null {
  const sp = new URLSearchParams(window.location.search)
  return sp.get('date')
}

function localDateKey(): string {
  // Local day (matches “midnight Pacific” expectations for most users).
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function itemById(items: PuzzleItem[], id: string): PuzzleItem {
  const it = items.find((i) => i.id === id)
  if (!it) throw new Error(`Missing puzzle item id: ${id}`)
  return it
}

function groupById(groups: PuzzleGroup[], id: string): PuzzleGroup {
  const g = groups.find((x) => x.id === id)
  if (!g) throw new Error(`Missing puzzle group id: ${id}`)
  return g
}

function App() {
  const [state, dispatch] = useReducer(reducer, { kind: 'loading' } satisfies LoadState)

  const defaultDateKey = useMemo(() => getPuzzleDateKeyFromUrl() ?? localDateKey(), [])

  useEffect(() => {
    // Apply theme as early as possible on load.
    applyTheme(getStoredTheme())
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const candidatePaths = [
        `${import.meta.env.BASE_URL}puzzles/${defaultDateKey}.json`,
        `${import.meta.env.BASE_URL}puzzles/2026-02-17.json`,
      ]

      for (const path of candidatePaths) {
        try {
          const res = await fetch(path)
          if (!res.ok) continue
          const raw = (await res.json()) as unknown
          const puzzle = assertPuzzle(raw)
          const game = createInitialGameState({ puzzle })
          if (!cancelled) dispatch({ type: 'load_ok', game })
          return
        } catch {
          // try next path
        }
      }

      if (!cancelled) {
        dispatch({
          type: 'load_err',
          message: `Could not load puzzle for ${defaultDateKey}.`,
        })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [defaultDateKey])

  if (state.kind === 'loading') {
    return (
      <div data-testid="app-root" className="app">
        <h1>Rain Connections</h1>
        <p data-testid="loading">Loading puzzle…</p>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div data-testid="app-root" className="app">
        <h1>Rain Connections</h1>
        <p data-testid="load-error">{state.message}</p>
      </div>
    )
  }

  const game = state.game
  const puzzle = game.puzzle
  const mistakesLeft = Math.max(0, game.mistakesAllowed - game.mistakesMade)

  const foundGroups = game.foundGroupIds.map((gid) => groupById(puzzle.groups, gid))
  const foundItemIds = new Set(foundGroups.flatMap((g) => g.itemIds))
  const remainingItemIds = game.boardItemIds.filter((id) => !foundItemIds.has(id))

  function reset() {
    dispatch({ type: 'reset', game: createInitialGameState({ puzzle }) })
  }

  return (
    <div data-testid="app-root" className="app">
      <header className="header">
        <div>
          <h1>Rain Connections</h1>
          <div className="subhead" data-testid="puzzle-title">
            {puzzle.title}
          </div>
        </div>
        <div className="header-actions">
          <Button data-testid="reset-button" type="button" variant="outline" onClick={reset}>
            Reset
          </Button>
          <SettingsMenu />
        </div>
      </header>

      <section className="status">
        <div data-testid="mistakes-left">Mistakes left: {mistakesLeft}</div>
        <div data-testid="game-status" data-state={game.status}>
          {game.status === 'playing' ? 'Playing' : game.status === 'won' ? 'Won' : 'Lost'}
        </div>
      </section>

      {game.lastMessage ? (
        <div data-testid="feedback" className="feedback" data-state={game.lastFoundGroupId ? 'ok' : 'info'}>
          {game.lastMessage}
        </div>
      ) : null}

      <section className="found">
        {foundGroups.map((g) => (
          <div key={g.id} className={colorToClass(g.color)} data-testid={`found-group-${g.id}`}>
            <div className="group-label">{g.label}</div>
            <div className="group-items">
              {g.itemIds.map((id) => (
                <span key={id} className="group-item">
                  {itemById(puzzle.items, id).text}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="board" data-testid="tile-grid">
        {remainingItemIds.map((id) => {
          const item = itemById(puzzle.items, id)
          const selected = game.selectedItemIds.includes(id)
          return (
            <Button
              key={id}
              type="button"
              variant="outline"
              className={cn('tile', selected && 'tile-selected')}
              data-testid={`tile-${id}`}
              data-state={selected ? 'selected' : 'idle'}
              onClick={() => dispatch({ type: 'toggle', itemId: id })}
              disabled={game.status !== 'playing'}
            >
              {item.text}
            </Button>
          )
        })}
      </section>

      <section className="controls">
        <Button
          data-testid="submit-guess-button"
          type="button"
          onClick={() => dispatch({ type: 'submit' })}
          disabled={game.status !== 'playing'}
        >
          Submit
        </Button>
      </section>

      {game.status !== 'playing' ? (
        <section className="reveal" data-testid="reveal-section">
          <h2>Solution</h2>
          {puzzle.groups.map((g) => (
            <div key={g.id} className={colorToClass(g.color)}>
              <div className="group-label">{g.label}</div>
              <div className="group-items">
                {g.itemIds.map((id) => (
                  <span key={id} className="group-item">
                    {itemById(puzzle.items, id).text}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}

    </div>
  )
}

export default App
