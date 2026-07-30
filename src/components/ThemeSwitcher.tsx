import type { AppCopy } from '../i18n.ts'
import type { ThemePreference } from '../theme.ts'

interface ThemeSwitcherProps {
  readonly copy: AppCopy['theme']
  readonly onChange: (theme: ThemePreference) => void
  readonly theme: ThemePreference
}

const THEME_OPTIONS = ['system', 'light', 'dark'] as const

function ThemeIcon({ theme }: { readonly theme: ThemePreference }) {
  if (theme === 'system') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <rect x="2.75" y="3.25" width="14.5" height="10.5" rx="0.75" />
        <path d="M7 16.75h6M10 13.75v3" />
      </svg>
    )
  }

  if (theme === 'light') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="3.25" />
        <path d="M10 1.75v2M10 16.25v2M1.75 10h2M16.25 10h2M4.17 4.17l1.42 1.42M14.41 14.41l1.42 1.42M15.83 4.17l-1.42 1.42M5.59 14.41l-1.42 1.42" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M16.6 12.7A7 7 0 0 1 7.3 3.4a7 7 0 1 0 9.3 9.3Z" />
    </svg>
  )
}

export function ThemeSwitcher({
  copy,
  onChange,
  theme,
}: ThemeSwitcherProps) {
  const labels: Readonly<Record<ThemePreference, string>> = {
    system: copy.systemLabel,
    light: copy.lightLabel,
    dark: copy.darkLabel,
  }

  return (
    <div className="theme-switch" role="group" aria-label={copy.pickerLabel}>
      {THEME_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          className="theme-switch__option"
          aria-label={labels[option]}
          aria-pressed={theme === option}
          title={labels[option]}
          onClick={() => onChange(option)}
        >
          <ThemeIcon theme={option} />
        </button>
      ))}
    </div>
  )
}
