export type Language = 'de' | 'en'

export const DEFAULT_LANGUAGE: Language = 'en'

export interface AppCopy {
  readonly language: {
    readonly pickerLabel: string
    readonly germanLabel: string
    readonly englishLabel: string
  }
  readonly theme: {
    readonly pickerLabel: string
    readonly systemLabel: string
    readonly lightLabel: string
    readonly darkLabel: string
  }
  readonly meta: {
    readonly title: string
    readonly description: string
    readonly openGraphTitle: string
    readonly openGraphDescription: string
    readonly openGraphLocale: string
  }
  readonly header: {
    readonly settings: string
  }
  readonly history: {
    readonly open: string
    readonly openLabel: (count: number) => string
    readonly kicker: string
    readonly title: string
    readonly empty: string
    readonly savedOn: (formattedDate: string) => string
    readonly entrySummary: (
      itemCount: number,
      decisionCount: number,
    ) => string
    readonly close: string
  }
  readonly storage: {
    readonly invalid: string
    readonly unavailable: string
    readonly writeFailed: string
  }
  readonly setup: {
    readonly kicker: string
    readonly title: string
    readonly description: string
    readonly examplesLabel: string
    readonly replaceExamples: string
    readonly insertExample: (title: string) => string
    readonly listLabel: string
    readonly itemCount: (count: number) => string
    readonly help: string
    readonly placeholder: string
    readonly start: string
    readonly expectedComparisons: (count: number) => string
    readonly localNote: string
  }
  readonly input: {
    readonly lineTooLong: (lineNumber: number, maximumLength: number) => string
    readonly tooManyItems: (maximumCount: number) => string
    readonly duplicate: (
      label: string,
      firstLineNumber: number,
      secondLineNumber: number,
    ) => string
    readonly tooFewItems: string
    readonly longSession: string
  }
  readonly comparison: {
    readonly progressLabel: string
    readonly progressSummary: (
      percent: number,
      decisionCount: number,
    ) => string
    readonly title: string
    readonly hint: string
    readonly undo: string
    readonly editList: string
    readonly liveQuestion: (
      decisionNumber: number,
      leftLabel: string,
      rightLabel: string,
    ) => string
  }
  readonly result: {
    readonly changeLastDecision: string
    readonly newRanking: string
    readonly resultTitle: string
    readonly decisionCount: (count: number) => string
    readonly copied: string
    readonly copyList: string
    readonly copyFailed: string
  }
  readonly graph: {
    readonly description: (nodeCount: number, edgeCount: number) => string
    readonly emptyDescription: string
    readonly kicker: string
    readonly title: string
    readonly controlsLabel: string
    readonly zoomOut: string
    readonly zoomIn: string
    readonly fit: string
    readonly expand: string
    readonly collapse: string
    readonly emptyMessage: string
    readonly renderError: string
    readonly legend: string
  }
  readonly reset: {
    readonly kicker: string
    readonly title: string
    readonly description: string
    readonly cancel: string
    readonly confirm: string
  }
}

function germanDecisionLabel(count: number): string {
  return count === 1 ? 'Entscheidung' : 'Entscheidungen'
}

function englishDecisionLabel(count: number): string {
  return count === 1 ? 'decision' : 'decisions'
}

export const copyByLanguage = {
  de: {
    language: {
      pickerLabel: 'Sprache',
      germanLabel: 'Deutsch',
      englishLabel: 'English',
    },
    theme: {
      pickerLabel: 'Darstellung',
      systemLabel: 'System',
      lightLabel: 'Hell',
      darkLabel: 'Dunkel',
    },
    meta: {
      title: 'Ranker – Deine persönliche Rangliste',
      description:
        'Erstelle deine persönliche Rangliste mit einfachen direkten Vergleichen.',
      openGraphTitle: 'Ranker – Was gewinnt?',
      openGraphDescription:
        'Aus einfachen Paarvergleichen wird deine persönliche Rangliste.',
      openGraphLocale: 'de_DE',
    },
    header: {
      settings: 'Einstellungen',
    },
    history: {
      open: 'Verlauf',
      openLabel: (count) =>
        count === 0
          ? 'Verlauf öffnen'
          : `Verlauf öffnen, ${count} ${count === 1 ? 'gespeicherte Rangliste' : 'gespeicherte Ranglisten'}`,
      kicker: 'Gespeicherte Ranglisten',
      title: 'Dein Verlauf',
      empty: 'Noch keine abgeschlossenen Ranglisten gespeichert.',
      savedOn: (formattedDate) => `Rangliste vom ${formattedDate}`,
      entrySummary: (itemCount, decisionCount) =>
        `${itemCount} ${itemCount === 1 ? 'Eintrag' : 'Einträge'} · ${decisionCount} ${germanDecisionLabel(decisionCount)}`,
      close: 'Schließen',
    },
    storage: {
      invalid:
        'Ein lokal gespeichertes Ranking war beschädigt und wurde ignoriert.',
      unavailable: 'Lokales Speichern ist in diesem Browser nicht verfügbar.',
      writeFailed: 'Deine Daten konnten nicht lokal gespeichert werden.',
    },
    setup: {
      kicker: 'Neue Rangliste',
      title: 'Was gewinnt?',
      description:
        'Ein Eintrag pro Zeile. Du entscheidest jeweils zwischen zwei – daraus entsteht deine Rangliste.',
      examplesLabel: 'Beispiele',
      replaceExamples: 'Andere',
      insertExample: (title) => `Beispiel „${title}“ einfügen`,
      listLabel: 'Deine Liste',
      itemCount: (count) =>
        `${count} ${count === 1 ? 'Eintrag' : 'Einträge'}`,
      help: 'Ein Eintrag pro Zeile, mindestens 2 und höchstens 50.',
      placeholder: 'Schokolade\nGummibärchen\nLakritz\nKekse',
      start: 'Ranking starten',
      expectedComparisons: (count) =>
        `Voraussichtlich ${count} ${count === 1 ? 'Vergleich' : 'Vergleiche'}`,
      localNote: 'Dein Fortschritt bleibt nur in diesem Browser gespeichert.',
    },
    input: {
      lineTooLong: (lineNumber, maximumLength) =>
        `Zeile ${lineNumber} ist länger als ${maximumLength} Zeichen.`,
      tooManyItems: (maximumCount) =>
        `Für diese Version sind höchstens ${maximumCount} Einträge möglich.`,
      duplicate: (label, firstLineNumber, secondLineNumber) =>
        `„${label}“ steht in Zeile ${firstLineNumber} und ${secondLineNumber}. Jeder Eintrag darf nur einmal vorkommen.`,
      tooFewItems: 'Füge mindestens zwei Einträge ein.',
      longSession:
        'Bei mehr als 30 Einträgen kann das Ranking einige Minuten dauern.',
    },
    comparison: {
      progressLabel: 'Fortschritt der Rangliste',
      progressSummary: (percent, decisionCount) =>
        `${percent} % bestimmt · ${decisionCount} ${germanDecisionLabel(decisionCount)}`,
      title: 'Was gewinnt?',
      hint:
        'Bleib bei demselben Kriterium und wähle immer genau eine Option.',
      undo: 'Rückgängig',
      editList: 'Liste ändern',
      liveQuestion: (decisionNumber, leftLabel, rightLabel) =>
        `Vergleich ${decisionNumber}: ${leftLabel} oder ${rightLabel}.`,
    },
    result: {
      changeLastDecision: 'Letzte Entscheidung ändern',
      newRanking: 'Neue Rangliste',
      resultTitle: 'Deine Rangliste',
      decisionCount: (count) => `${count} ${germanDecisionLabel(count)}`,
      copied: 'Kopiert',
      copyList: 'Liste kopieren',
      copyFailed: 'Kopieren ist in diesem Browser gerade nicht möglich.',
    },
    graph: {
      description: (nodeCount, edgeCount) =>
        `${nodeCount} ${nodeCount === 1 ? 'sichtbarer Eintrag' : 'sichtbare Einträge'} und ${edgeCount} ${germanDecisionLabel(edgeCount)}. Pfeile zeigen zum höher eingeordneten Eintrag.`,
      emptyDescription: 'Der Entscheidungsgraph ist noch leer.',
      kicker: 'Entscheidungsweg',
      title: 'Dein Entscheidungsgraph',
      controlsLabel: 'Graphansicht steuern',
      zoomOut: 'Graph verkleinern',
      zoomIn: 'Graph vergrößern',
      fit: 'Einpassen',
      expand: 'Große Graphansicht öffnen',
      collapse: 'Kompakte Graphansicht anzeigen',
      emptyMessage: 'Dein Graph entsteht mit der ersten Entscheidung.',
      renderError:
        'Der Graph konnte gerade nicht dargestellt werden. Deine Entscheidungen bleiben gespeichert.',
      legend: 'Der Pfeil zeigt immer zum höher eingeordneten Eintrag.',
    },
    reset: {
      kicker: 'Ranking verlassen',
      title: 'Bisherige Entscheidungen löschen?',
      description:
        'Deine Liste bleibt im Eingabefeld erhalten. Die bereits getroffenen Vergleiche lassen sich danach nicht wiederherstellen.',
      cancel: 'Abbrechen',
      confirm: 'Ranking löschen',
    },
  },
  en: {
    language: {
      pickerLabel: 'Language',
      germanLabel: 'Deutsch',
      englishLabel: 'English',
    },
    theme: {
      pickerLabel: 'Appearance',
      systemLabel: 'System',
      lightLabel: 'Light',
      darkLabel: 'Dark',
    },
    meta: {
      title: 'Ranker – Your personal ranking',
      description:
        'Create your personal ranking through simple head-to-head comparisons.',
      openGraphTitle: 'Ranker – What wins?',
      openGraphDescription:
        'Turn simple pairwise comparisons into your personal ranking.',
      openGraphLocale: 'en_US',
    },
    header: {
      settings: 'Settings',
    },
    history: {
      open: 'History',
      openLabel: (count) =>
        count === 0
          ? 'Open history'
          : `Open history, ${count} saved ${count === 1 ? 'ranking' : 'rankings'}`,
      kicker: 'Saved rankings',
      title: 'Your history',
      empty: 'No completed rankings have been saved yet.',
      savedOn: (formattedDate) => `Ranking from ${formattedDate}`,
      entrySummary: (itemCount, decisionCount) =>
        `${itemCount} ${itemCount === 1 ? 'item' : 'items'} · ${decisionCount} ${englishDecisionLabel(decisionCount)}`,
      close: 'Close',
    },
    storage: {
      invalid:
        'A locally saved ranking was corrupted and has been ignored.',
      unavailable: 'Local storage is not available in this browser.',
      writeFailed: 'Your data could not be saved locally.',
    },
    setup: {
      kicker: 'New ranking',
      title: 'What wins?',
      description:
        'Add one item per line. You choose between two at a time – Ranker turns that into your ranking.',
      examplesLabel: 'Examples',
      replaceExamples: 'More',
      insertExample: (title) => `Insert the “${title}” example`,
      listLabel: 'Your list',
      itemCount: (count) => `${count} ${count === 1 ? 'item' : 'items'}`,
      help: 'One item per line, with a minimum of 2 and a maximum of 50.',
      placeholder: 'Chocolate\nGummy bears\nLicorice\nCookies',
      start: 'Start ranking',
      expectedComparisons: (count) =>
        `About ${count} ${count === 1 ? 'comparison' : 'comparisons'} expected`,
      localNote: 'Your progress is stored only in this browser.',
    },
    input: {
      lineTooLong: (lineNumber, maximumLength) =>
        `Line ${lineNumber} is longer than ${maximumLength} characters.`,
      tooManyItems: (maximumCount) =>
        `This version supports a maximum of ${maximumCount} items.`,
      duplicate: (label, firstLineNumber, secondLineNumber) =>
        `“${label}” appears on lines ${firstLineNumber} and ${secondLineNumber}. Each item may appear only once.`,
      tooFewItems: 'Add at least two items.',
      longSession:
        'With more than 30 items, the ranking may take several minutes.',
    },
    comparison: {
      progressLabel: 'Ranking progress',
      progressSummary: (percent, decisionCount) =>
        `${percent}% determined · ${decisionCount} ${englishDecisionLabel(decisionCount)}`,
      title: 'What wins?',
      hint:
        'Keep using the same criterion and always choose exactly one option.',
      undo: 'Undo',
      editList: 'Edit list',
      liveQuestion: (decisionNumber, leftLabel, rightLabel) =>
        `Comparison ${decisionNumber}: ${leftLabel} or ${rightLabel}.`,
    },
    result: {
      changeLastDecision: 'Change last decision',
      newRanking: 'New ranking',
      resultTitle: 'Your ranking',
      decisionCount: (count) => `${count} ${englishDecisionLabel(count)}`,
      copied: 'Copied',
      copyList: 'Copy list',
      copyFailed: 'Copying is not currently available in this browser.',
    },
    graph: {
      description: (nodeCount, edgeCount) =>
        `${nodeCount} visible ${nodeCount === 1 ? 'item' : 'items'} and ${edgeCount} ${englishDecisionLabel(edgeCount)}. Arrows point to the higher-ranked item.`,
      emptyDescription: 'The decision graph is still empty.',
      kicker: 'Decision path',
      title: 'Your decision graph',
      controlsLabel: 'Control graph view',
      zoomOut: 'Zoom out',
      zoomIn: 'Zoom in',
      fit: 'Fit to view',
      expand: 'Open large graph view',
      collapse: 'Show compact graph view',
      emptyMessage: 'Your graph will appear after the first decision.',
      renderError:
        'The graph could not be displayed. Your decisions are still saved.',
      legend: 'The arrow always points to the higher-ranked item.',
    },
    reset: {
      kicker: 'Leave ranking',
      title: 'Delete previous decisions?',
      description:
        'Your list will remain in the input field. The comparisons you have already made cannot be recovered afterward.',
      cancel: 'Cancel',
      confirm: 'Delete ranking',
    },
  },
} satisfies Readonly<Record<Language, AppCopy>>
