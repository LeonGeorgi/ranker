import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { ComparisonPanel } from './components/ComparisonPanel.tsx'
import { ConfirmResetDialog } from './components/ConfirmResetDialog.tsx'
import { ListSetup } from './components/ListSetup.tsx'
import { RankingGraph } from './components/RankingGraph.tsx'
import { RankingResult } from './components/RankingResult.tsx'
import {
  copyByLanguage,
  DEFAULT_LANGUAGE,
  type AppCopy,
  type Language,
} from './i18n.ts'
import {
  readStoredLanguage,
  writeStoredLanguage,
} from './language-storage.ts'
import {
  answerRankingQuestion,
  createRankingSession,
  deriveRankingSnapshot,
  RankingSessionError,
  undoLastRankingDecision,
  type RankingGraph as RankingGraphData,
  type RankingSession,
} from './ranking/index.ts'
import {
  clearStoredRankingSession,
  readStoredRankingSession,
  writeStoredRankingSession,
  type StoredSessionIssue,
} from './ranking/storage.ts'

const EMPTY_GRAPH: RankingGraphData = { nodes: [], edges: [] }

interface InitialAppState {
  readonly issue: StoredSessionIssue
  readonly language: Language
  readonly session: RankingSession | null
}

type StorageWarningCode =
  | Exclude<StoredSessionIssue, null>
  | 'write-failed'
  | null

function loadInitialAppState(): InitialAppState {
  try {
    const storage = window.localStorage
    const storedSession = readStoredRankingSession(storage)
    return {
      ...storedSession,
      language: readStoredLanguage(storage),
    }
  } catch {
    return {
      issue: 'unavailable',
      language: DEFAULT_LANGUAGE,
      session: null,
    }
  }
}

function persistLanguage(language: Language): void {
  try {
    writeStoredLanguage(window.localStorage, language)
  } catch {
    // The in-memory language change remains usable when browser storage is blocked.
  }
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

function setMetaContent(selector: string, content: string): void {
  document
    .querySelector<HTMLMetaElement>(selector)
    ?.setAttribute('content', content)
}

function App() {
  const [initialState] = useState(loadInitialAppState)
  const [language, setLanguage] = useState<Language>(initialState.language)
  const [session, setSession] = useState<RankingSession | null>(
    initialState.session,
  )
  const [draft, setDraft] = useState(() =>
    initialState.session?.items.map((item) => item.label).join('\n') ?? '',
  )
  const [isResultRevealed, setIsResultRevealed] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [storageWarningCode, setStorageWarningCode] =
    useState<StorageWarningCode>(initialState.issue)
  const copy = copyByLanguage[language]
  const storageWarning = getStorageWarningMessage(
    storageWarningCode,
    copy.storage,
  )
  const snapshot = useMemo(
    () => (session === null ? null : deriveRankingSnapshot(session)),
    [session],
  )
  const activeItemIds = useMemo(() => {
    const question = snapshot?.currentQuestion
    return question === null || question === undefined
      ? []
      : [question.left.id, question.right.id]
  }, [snapshot?.currentQuestion])
  const previousSessionRef = useRef(session)

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage)
    persistLanguage(nextLanguage)
  }

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
    const previousSession = previousSessionRef.current
    previousSessionRef.current = session

    if (session === null && previousSession === null) {
      return
    }

    let isCancelled = false

    void Promise.resolve().then(() => {
      const wasStored =
        session === null
          ? clearStoredRankingSession(window.localStorage)
          : writeStoredRankingSession(window.localStorage, session)

      if (!isCancelled) {
        setStorageWarningCode(wasStored ? null : 'write-failed')
      }
    })

    return () => {
      isCancelled = true
    }
  }, [session])

  const startRanking = (labels: readonly string[]) => {
    setSession(createRankingSession(labels, createSessionSeed()))
    setDraft(labels.join('\n'))
    setIsResultRevealed(false)
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
      setIsResultRevealed(false)
    },
    [],
  )

  const undoDecision = useCallback(() => {
    setSession((currentSession) =>
      currentSession === null
        ? null
        : undoLastRankingDecision(currentSession),
    )
    setIsResultRevealed(false)
  }, [])

  const editList = () => {
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
    setIsResultRevealed(false)
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
          <div className="app-header__status">
            {hasActiveSession ? (
              <>
                <span className="status-dot" aria-hidden="true" />
                {storageWarning === null
                  ? copy.header.stored
                  : copy.header.temporary}
              </>
            ) : (
              copy.header.tagline
            )}
          </div>

          <div
            className="language-switch"
            role="group"
            aria-label={copy.language.pickerLabel}
          >
            <button
              type="button"
              className="language-switch__option"
              lang="de"
              aria-label={copy.language.germanLabel}
              aria-pressed={language === 'de'}
              onClick={() => changeLanguage('de')}
            >
              DE
            </button>
            <button
              type="button"
              className="language-switch__option"
              lang="en"
              aria-label={copy.language.englishLabel}
              aria-pressed={language === 'en'}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
          </div>
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
            language={language}
            snapshot={snapshot}
            storageWarning={storageWarning}
            onChoose={chooseItem}
            onUndo={undoDecision}
            onEditList={editList}
          />
        ) : (
          <RankingResult
            ranking={snapshot.finalRanking}
            decisionCount={snapshot.progress.decisionCount}
            isRevealed={isResultRevealed}
            language={language}
            onReveal={() => setIsResultRevealed(true)}
            onUndo={undoDecision}
            onEditList={editList}
          />
        )}

        {hasActiveSession && (
          <RankingGraph
            activeItemIds={activeItemIds}
            graph={graph}
            language={language}
          />
        )}
      </main>

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
