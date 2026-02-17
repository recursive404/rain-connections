export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'rain-connections.theme'

export function getStoredTheme(): ThemeMode {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  return 'system'
}

export function storeTheme(mode: ThemeMode) {
  localStorage.setItem(STORAGE_KEY, mode)
}

export function prefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false
}

export function applyTheme(mode: ThemeMode) {
  const resolved = mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode
  const root = document.documentElement
  if (resolved === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

