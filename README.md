# rain-connections

Connections-style grouping puzzle (test project).

## Dev

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
bun run preview
```

## Moderation + publishing workflow (current)

We’re using the xdOS home server to manage a moderation queue:

- `rain-connections/#puzzles-unpublished` — candidate puzzles / generation requests
- `rain-connections/#puzzles-published` — approved puzzles

Publishing a daily puzzle (manual for now):

1. Pick an approved puzzle (or request) from `#puzzles-published`.
2. Commit it as `public/puzzles/YYYY-MM-DD.json`.
3. Merge to `main` (via PR). GitHub Pages redeploys automatically.
