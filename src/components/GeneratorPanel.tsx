import { useMemo, useState } from 'react'

function localDateKey(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function GeneratorPanel() {
  const defaultDate = useMemo(() => localDateKey(), [])
  const [date, setDate] = useState(defaultDate)
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  async function copyRequest() {
    const payload = {
      version: 1,
      requestedDate: date,
      prompt,
      notes: 'Paste this into #puzzles-unpublished for moderation/generation.',
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      setStatus('Copied request JSON to clipboard.')
    } catch {
      setStatus('Could not write to clipboard (browser permissions).')
    }
  }

  return (
    <section className="generator" data-testid="generator-panel">
      <h2>Generate (beta)</h2>
      <p className="subhead">
        Stub workflow: this does <strong>not</strong> call an LLM yet. It prepares a request you can paste into the
        home-server moderation queue.
      </p>

      <label className="field">
        <span>Date key (YYYY-MM-DD)</span>
        <input
          data-testid="generator-date-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          inputMode="numeric"
          placeholder="2026-02-17"
        />
      </label>

      <label className="field">
        <span>Prompt</span>
        <textarea
          data-testid="generator-prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the kind of puzzle you want..."
          rows={4}
        />
      </label>

      <button
        type="button"
        className="secondary"
        data-testid="generator-copy-button"
        onClick={copyRequest}
        disabled={prompt.trim().length === 0}
      >
        Copy request JSON
      </button>

      {status ? (
        <div className="feedback" data-testid="generator-status">
          {status}
        </div>
      ) : null}
    </section>
  )
}

