import SwitchButton from '@/components/kokonutui/switch-button'
import { resolvedTheme, setPreferences, usePreferences } from '@/lib/preferences'

/** One-click light/dark switch (Kokonut switch-button) wired to the preferences store. */
export default function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const preferences = usePreferences()
  return (
    <SwitchButton
      size="default"
      showLabel={showLabel}
      theme={resolvedTheme(preferences)}
      onThemeChange={(mode) => setPreferences({ mode })}
      reveal={!preferences.calm}
      aria-label="Toggle dark mode"
      className="shrink-0 rounded-full"
    />
  )
}
