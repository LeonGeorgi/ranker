export type ThemePreference = 'system' | 'light' | 'dark'

export type ColorScheme = Exclude<ThemePreference, 'system'>

export const DEFAULT_THEME: ThemePreference = 'system'
export const THEME_STORAGE_KEY = 'ranker.theme'

export interface ThemeStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function readStoredTheme(storage: ThemeStorage): ThemePreference {
  try {
    const theme = storage.getItem(THEME_STORAGE_KEY)
    return theme === 'system' || theme === 'light' || theme === 'dark'
      ? theme
      : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function writeStoredTheme(
  storage: ThemeStorage,
  theme: ThemePreference,
): boolean {
  try {
    storage.setItem(THEME_STORAGE_KEY, theme)
    return true
  } catch {
    return false
  }
}
