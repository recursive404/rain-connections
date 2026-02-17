import { useEffect, useMemo, useState } from 'react'
import { Settings } from 'lucide-react'
import type { ThemeMode } from '../theme/theme'
import { applyTheme, getStoredTheme, storeTheme } from '../theme/theme'
import { GeneratorPanel } from './GeneratorPanel'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Separator } from './ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'

export function SettingsMenu() {
  const initialMode = useMemo(() => getStoredTheme(), [])
  const [mode, setMode] = useState<ThemeMode>(initialMode)

  useEffect(() => {
    applyTheme(mode)

    // Keep the UI in sync if system theme flips while in system mode.
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return

    function onChange() {
      if (mode === 'system') applyTheme('system')
    }

    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  function onModeChange(next: ThemeMode) {
    setMode(next)
    storeTheme(next)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button data-testid="settings-button" type="button" variant="outline" size="icon" aria-label="Settings">
          <Settings size={18} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[360px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-select">Theme</Label>
            <Select value={mode} onValueChange={(v) => onModeChange(v as ThemeMode)}>
              <SelectTrigger id="theme-select" data-testid="theme-select">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <GeneratorPanel />

          <Separator />

          <div className="text-sm text-muted-foreground">
            Tip: for new puzzles, paste the request JSON into <code>#puzzles-unpublished</code>.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

