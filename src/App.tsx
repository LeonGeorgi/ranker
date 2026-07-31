import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import './App.css'
import { ComparisonPanel } from './components/ComparisonPanel.tsx'
import { ConfirmResetDialog } from './components/ConfirmResetDialog.tsx'
import { ListSetup } from './components/ListSetup.tsx'
import { RankingHistoryDialog } from './components/RankingHistoryDialog.tsx'
import { RankingGraph } from './components/RankingGraph.tsx'
import { RankingResult } from './components/RankingResult.tsx'
import { ThemeSwitcher } from './components/ThemeSwitcher.tsx'
import {
  copyByLanguage,
  type AppCopy,
  type Language,
} from './i18n.ts'
import {
  getBrowserPreferredLanguage,
  readStoredLanguage,
  writeStoredLanguage,
} from './language-storage.ts'
import {
  addRankingHistoryEntry,
  answerRankingQuestion,
  createCompletedRankingHistoryEntry,
  createEmptyRankingHistory,
  createRankingSession,
  deriveRankingSnapshot,
  RankingSessionError,
  undoLastRankingDecision,
  type RankingGraph as RankingGraphData,
  type RankingHistory,
  type RankingSession,
} from './ranking/index.ts'
import {
  clearStoredRankingSession,
  readStoredRankingHistory,
  readStoredRankingSession,
  writeStoredRankingHistory,
  writeStoredRankingSession,
  type RankingStorage,
  type StoredSessionIssue,
} from './ranking/storage.ts'
import {
  DEFAULT_THEME,
  readStoredTheme,
  writeStoredTheme,
  type ColorScheme,
  type ThemePreference,
} from './theme.ts'

const EMPTY_GRAPH: RankingGraphData = { nodes: [], edges: [] }

interface InitialAppState {
  readonly history: RankingHistory
  readonly historyIssue: StoredSessionIssue
  readonly language: Language
  readonly session: RankingSession | null
  readonly sessionIssue: StoredSessionIssue
  readonly storage: RankingStorage | null
  readonly theme: ThemePreference
}

type StorageWarningCode =
  | Exclude<StoredSessionIssue, null>
  | 'write-failed'
  | null

type AppPhase = 'setup' | 'comparing' | 'result'

const PHASE_HEADING_IDS: Readonly<Record<AppPhase, string>> = {
  setup: 'setup-title',
  comparing: 'comparison-title',
  result: 'result-title',
}

interface LanguageSwitcherProps {
  readonly copy: AppCopy['language']
  readonly language: Language
  readonly onChange: (language: Language) => void
}

function LanguageSwitcher({
  copy,
  language,
  onChange,
}: LanguageSwitcherProps) {
  return (
    <div
      className="language-switch"
      role="group"
      aria-label={copy.pickerLabel}
    >
      <button
        type="button"
        className="language-switch__option"
        lang="en"
        aria-label={copy.englishLabel}
        aria-pressed={language === 'en'}
        onClick={() => onChange('en')}
      >
        EN
      </button>
      <button
        type="button"
        className="language-switch__option"
        lang="de"
        aria-label={copy.germanLabel}
        aria-pressed={language === 'de'}
        onClick={() => onChange('de')}
      >
        DE
      </button>
    </div>
  )
}

interface HistoryButtonProps {
  readonly copy: AppCopy['history']
  readonly count: number
  readonly isDialogOpen: boolean
  readonly isCompact?: boolean
  readonly onOpen: () => void
}

function HistoryButton({
  copy,
  count,
  isDialogOpen,
  isCompact = false,
  onOpen,
}: HistoryButtonProps) {
  const label = copy.openLabel(count)

  return (
    <button
      type="button"
      className={
        isCompact
          ? 'history-button history-button--compact'
          : 'history-button'
      }
      aria-controls="ranking-history-dialog"
      aria-expanded={isDialogOpen}
      aria-haspopup="dialog"
      aria-label={label}
      title={label}
      onClick={onOpen}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="7" />
        <path d="M10 5.75V10l2.75 1.75" />
        <path d="M4.75 4.75 3 4.6l.15 1.75" />
      </svg>
      {!isCompact && <span>{copy.open}</span>}
      {count > 0 && <span className="history-button__count">{count}</span>}
    </button>
  )
}

interface MobileSettingsProps {
  readonly copy: AppCopy
  readonly language: Language
  readonly onLanguageChange: (language: Language) => void
  readonly onThemeChange: (theme: ThemePreference) => void
  readonly theme: ThemePreference
}

function MobileSettings({
  copy,
  language,
  onLanguageChange,
  onThemeChange,
  theme,
}: MobileSettingsProps) {
  return (
    <details className="mobile-settings">
      <summary aria-label={copy.header.settings} title={copy.header.settings}>
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M3 5h14M3 10h14M3 15h14" />
          <circle cx="7" cy="5" r="1.5" />
          <circle cx="13" cy="10" r="1.5" />
          <circle cx="8.5" cy="15" r="1.5" />
        </svg>
      </summary>
      <div className="mobile-settings__panel">
        <div className="mobile-settings__row">
          <span>{copy.theme.pickerLabel}</span>
          <ThemeSwitcher
            copy={copy.theme}
            theme={theme}
            onChange={onThemeChange}
          />
        </div>
        <div className="mobile-settings__row">
          <span>{copy.language.pickerLabel}</span>
          <LanguageSwitcher
            copy={copy.language}
            language={language}
            onChange={onLanguageChange}
          />
        </div>
      </div>
    </details>
  )
}

function getBrowserStorage(): RankingStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function loadInitialAppState(): InitialAppState {
  const browserLanguage = getBrowserPreferredLanguage(
    window.navigator.language,
  )
  const storage = getBrowserStorage()

  if (storage === null) {
    return {
      history: createEmptyRankingHistory(),
      historyIssue: 'unavailable',
      language: browserLanguage,
      session: null,
      sessionIssue: 'unavailable',
      storage: null,
      theme: DEFAULT_THEME,
    }
  }

  const storedHistory = readStoredRankingHistory(storage)
  const storedSession = readStoredRankingSession(storage)
  return {
    history: storedHistory.history,
    historyIssue: storedHistory.issue,
    language: readStoredLanguage(storage, browserLanguage),
    session: storedSession.session,
    sessionIssue: storedSession.issue,
    storage,
    theme: readStoredTheme(storage),
  }
}

function persistLanguage(
  storage: RankingStorage | null,
  language: Language,
): void {
  if (storage !== null) {
    writeStoredLanguage(storage, language)
  }
}

function persistTheme(
  storage: RankingStorage | null,
  theme: ThemePreference,
): void {
  if (storage !== null) {
    writeStoredTheme(storage, theme)
  }
}

function useSystemPrefersDarkMode(): boolean {
  const [prefersDarkMode, setPrefersDarkMode] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersDarkMode(event.matches)
    }
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersDarkMode
}

function createSessionSeed(): number {
  const values = new Uint32Array(1)
  window.crypto.getRandomValues(values)
  return values[0] ?? Date.now() >>> 0
}

function getStorageWarningMessage(
  code: StorageWarningCode,
  copy: AppCopy['storage'],
): string | null {
  if (code === 'invalid') {
    return copy.invalid
  }
  if (code === 'unavailable') {
    return copy.unavailable
  }
  if (code === 'write-failed') {
    return copy.writeFailed
  }
  return null
}

function combineStorageWarningCodes(
  ...codes: readonly StorageWarningCode[]
): StorageWarningCode {
  if (codes.includes('unavailable')) {
    return 'unavailable'
  }
  if (codes.includes('write-failed')) {
    return 'write-failed'
  }
  if (codes.includes('invalid')) {
    return 'invalid'
  }
  return null
}

function setMetaContent(selector: string, content: string): void {
  document
    .querySelector<HTMLMetaElement>(selector)
    ?.setAttribute('content', content)
}

function App() {
  const [initialState] = useState(loadInitialAppState)
  const [language, setLanguage] = useState<Language>(initialState.language)
  const [theme, setTheme] = useState<ThemePreference>(initialState.theme)
  const [history, setHistory] = useState<RankingHistory>(initialState.history)
  const [session, setSession] = useState<RankingSession | null>(
    initialState.session,
  )
  const [draft, setDraft] = useState(() =>
    initialState.session?.items.map((item) => item.label).join('\n') ?? '',
  )
  const [shouldAnimateResult, setShouldAnimateResult] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [historyStorageWarningCode, setHistoryStorageWarningCode] =
    useState<StorageWarningCode>(initialState.historyIssue)
  const [sessionStorageWarningCode, setSessionStorageWarningCode] =
    useState<StorageWarningCode>(initialState.sessionIssue)
  const storage = initialState.storage
  const prefersDarkMode = useSystemPrefersDarkMode()
  const colorScheme: ColorScheme =
    theme === 'system' ? (prefersDarkMode ? 'dark' : 'light') : theme
  const copy = copyByLanguage[language]
  const storageWarningCode = combineStorageWarningCodes(
    sessionStorageWarningCode,
    historyStorageWarningCode,
  )
  const storageWarning = getStorageWarningMessage(
    storageWarningCode,
    copy.storage,
  )
  const snapshot = useMemo(
    () => (session === null ? null : deriveRankingSnapshot(session)),
    [session],
  )
  const appPhase: AppPhase =
    session === null || snapshot === null
      ? 'setup'
      : snapshot.finalRanking === null
        ? 'comparing'
        : 'result'
  const activeItemIds = useMemo(() => {
    const question = snapshot?.currentQuestion
    return question === null || question === undefined
      ? []
      : [question.left.id, question.right.id]
  }, [snapshot?.currentQuestion])
  const historyRef = useRef(history)
  const previousSessionRef = useRef(session)
  const previousPhaseRef = useRef(appPhase)

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage)
    persistLanguage(storage, nextLanguage)
  }

  const changeTheme = (nextTheme: ThemePreference) => {
    setTheme(nextTheme)
    persistTheme(storage, nextTheme)
  }

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = colorScheme
    setMetaContent(
      'meta[name="theme-color"]',
      colorScheme === 'dark' ? '#151815' : '#f3efe4',
    )
  }, [colorScheme])

  useEffect(() => {
    document.documentElement.lang = language
    document.title = copy.meta.title
    setMetaContent('meta[name="description"]', copy.meta.description)
    setMetaContent('meta[property="og:title"]', copy.meta.openGraphTitle)
    setMetaContent(
      'meta[property="og:description"]',
      copy.meta.openGraphDescription,
    )
    setMetaContent('meta[property="og:locale"]', copy.meta.openGraphLocale)
  }, [copy, language])

  useEffect(() => {
    historyRef.current = history
  }, [history])

  useEffect(() => {
    if (session === null || snapshot?.finalRanking === null) {
      return
    }

    const historyEntry = createCompletedRankingHistoryEntry(
      session,
      window.crypto.randomUUID(),
      Date.now(),
    )
    if (historyEntry === null) {
      return
    }

    const updatedHistory = addRankingHistoryEntry(
      historyRef.current,
      historyEntry,
    )
    if (updatedHistory === historyRef.current) {
      return
    }

    historyRef.current = updatedHistory
    setHistory(updatedHistory)
    const wasStored =
      storage !== null && writeStoredRankingHistory(storage, updatedHistory)
    setHistoryStorageWarningCode(
      storage === null ? 'unavailable' : wasStored ? null : 'write-failed',
    )
  }, [session, snapshot, storage])

  useEffect(() => {
    const previousPhase = previousPhaseRef.current
    previousPhaseRef.current = appPhase

    if (previousPhase === appPhase) {
      return
    }

    window.scrollTo({ top: 0, left: 0 })
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(PHASE_HEADING_IDS[appPhase])?.focus({
        preventScroll: true,
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [appPhase])

  useEffect(() => {
    const previousSession = previousSessionRef.current
    previousSessionRef.current = session

    if (session === null && previousSession === null) {
      return
    }

    let isCancelled = false

    void Promise.resolve().then(() => {
      const wasStored =
        storage !== null &&
        (session === null
          ? clearStoredRankingSession(storage)
          : writeStoredRankingSession(storage, session))

      if (!isCancelled) {
        setSessionStorageWarningCode(
          storage === null ? 'unavailable' : wasStored ? null : 'write-failed',
        )
      }
    })

    return () => {
      isCancelled = true
    }
  }, [session, storage])

  const startRanking = (labels: readonly string[]) => {
    setSession(createRankingSession(labels, createSessionSeed()))
    setDraft(labels.join('\n'))
    setShouldAnimateResult(false)
    window.scrollTo({ top: 0, left: 0 })
  }

  const chooseItem = useCallback(
    (preferredItemId: string, questionId: string) => {
      setSession((currentSession) => {
        if (currentSession === null) {
          return null
        }

        try {
          return answerRankingQuestion(
            currentSession,
            preferredItemId,
            questionId,
          )
        } catch (error) {
          if (
            error instanceof RankingSessionError &&
            error.code === 'stale-question'
          ) {
            return currentSession
          }
          throw error
        }
      })
      setShouldAnimateResult(true)
    },
    [],
  )

  const undoDecision = useCallback(() => {
    setSession((currentSession) =>
      currentSession === null
        ? null
        : undoLastRankingDecision(currentSession),
    )
    setShouldAnimateResult(false)
  }, [])

  const editList = () => {
    if (snapshot !== null && snapshot.finalRanking !== null) {
      resetRanking()
      return
    }

    if (session !== null && session.decisions.length > 0) {
      setIsResetDialogOpen(true)
      return
    }

    resetRanking()
  }

  const resetRanking = () => {
    if (session !== null) {
      setDraft(session.items.map((item) => item.label).join('\n'))
    }
    setSession(null)
    setShouldAnimateResult(false)
    setIsResetDialogOpen(false)
    window.scrollTo({ top: 0, left: 0 })
  }

  const hasActiveSession = session !== null && snapshot !== null
  const graph = snapshot?.graph ?? EMPTY_GRAPH

  return (
    <div className="app-shell" lang={language}>
      <header className="app-header">
        <div className="brand" aria-label="Ranker">
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 36 36" focusable="false">
              <path d="M7 29v-5.5c0-5 4-9 9-9h2" />
              <path d="M29 29v-5.5c0-5-4-9-9-9h-2" />
              <path d="M18 15V7" />
              <path d="m14 11 4-4 4 4" />
              <circle cx="7" cy="29" r="2" />
              <circle cx="29" cy="29" r="2" />
            </svg>
          </span>
          <span className="brand__word">Ranker</span>
        </div>

        <div className="app-header__tools">
          <HistoryButton
            copy={copy.history}
            count={history.entries.length}
            isDialogOpen={isHistoryDialogOpen}
            onOpen={() => setIsHistoryDialogOpen(true)}
          />

          <ThemeSwitcher
            copy={copy.theme}
            theme={theme}
            onChange={changeTheme}
          />

          <LanguageSwitcher
            copy={copy.language}
            language={language}
            onChange={changeLanguage}
          />
        </div>

        <div className="app-header__mobile-tools">
          <HistoryButton
            copy={copy.history}
            count={history.entries.length}
            isCompact
            isDialogOpen={isHistoryDialogOpen}
            onOpen={() => setIsHistoryDialogOpen(true)}
          />
          <MobileSettings
            copy={copy}
            language={language}
            onLanguageChange={changeLanguage}
            onThemeChange={changeTheme}
            theme={theme}
          />
        </div>
      </header>

      <main
        className={
          hasActiveSession
            ? 'app-workspace'
            : 'app-workspace app-workspace--setup'
        }
      >
        {session === null || snapshot === null ? (
          <ListSetup
            draft={draft}
            language={language}
            onDraftChange={setDraft}
            onStart={startRanking}
            storageWarning={storageWarning}
          />
        ) : snapshot.finalRanking === null ? (
          <ComparisonPanel
            areKeyboardShortcutsEnabled={
              !isHistoryDialogOpen && !isResetDialogOpen
            }
            language={language}
            snapshot={snapshot}
            storageWarning={storageWarning}
            onChoose={chooseItem}
            onUndo={undoDecision}
            onEditList={editList}
          />
        ) : (
          <RankingResult
            animateReveal={shouldAnimateResult}
            ranking={snapshot.finalRanking}
            decisionCount={snapshot.progress.decisionCount}
            language={language}
            storageWarning={storageWarning}
            onUndo={undoDecision}
            onEditList={editList}
          />
        )}

        {hasActiveSession && (
          <RankingGraph
            activeItemIds={activeItemIds}
            colorScheme={colorScheme}
            graph={graph}
            language={language}
          />
        )}
      </main>

      <RankingHistoryDialog
        history={history.entries}
        isOpen={isHistoryDialogOpen}
        language={language}
        onClose={() => setIsHistoryDialogOpen(false)}
      />

      <ConfirmResetDialog
        isOpen={isResetDialogOpen}
        language={language}
        onCancel={() => setIsResetDialogOpen(false)}
        onConfirm={resetRanking}
      />
    </div>
  )
}

export default App
