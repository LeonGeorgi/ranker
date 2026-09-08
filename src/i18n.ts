import type { RankingExampleId } from './ranking-examples.ts'

export type Language = 'de' | 'en'

export const DEFAULT_LANGUAGE: Language = 'en'

export interface AppCopy {
  readonly sessionSummary: (itemCount: number, decisionCount: number) => string
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
    readonly title: string
    readonly description: string
    readonly examplesLabel: string
    readonly exampleLabels: Readonly<Record<RankingExampleId, string>>
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
    readonly progressSummary: (percent: number) => string
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
    readonly copied: string
    readonly copyList: string
    readonly copyFailed: string
  }
  readonly graph: {
    readonly description: (nodeCount: number, edgeCount: number) => string
    readonly emptyDescription: string
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
    sessionSummary: (itemCount, decisionCount) =>
      `${itemCount} ${itemCount === 1 ? 'Eintrag' : 'Einträge'} · ${decisionCount} ${germanDecisionLabel(decisionCount)}`,
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
      title: 'Neue Rangliste',
      description:
        'Vergleiche je zwei Einträge nach deiner Vorliebe.',
      examplesLabel: 'Beispiel einsetzen',
      exampleLabels: {
        'apartment-features': 'Wohnen',
        'working-conditions': 'Arbeit',
        superpowers: 'Superkräfte',
        'essential-inventions': 'Erfindungen',
        'desert-island': 'Inselgepäck',
        'travel-destinations': 'Reiseziele',
        'ice-cream-flavors': 'Eissorten',
      },
      replaceExamples: 'Andere',
      insertExample: (title) => `Beispiel „${title}“ einfügen`,
      listLabel: 'Deine Einträge',
      itemCount: (count) =>
        `${count} ${count === 1 ? 'Eintrag' : 'Einträge'}`,
      help: '2–50 Einträge, ein Eintrag pro Zeile.',
      placeholder: 'Liste eingeben oder einfügen',
      start: 'Vergleichen',
      expectedComparisons: (count) =>
        `Voraussichtlich ${count} ${count === 1 ? 'Vergleich' : 'Vergleiche'}`,
      localNote: 'Automatisch in diesem Browser gespeichert.',
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
      progressSummary: (percent) => `${percent} % der Reihenfolge bestimmt`,
      title: 'Was ist dir lieber?',
      hint: 'Entscheide nach demselben Kriterium.',
      undo: 'Rückgängig',
      editList: 'Liste ändern',
      liveQuestion: (decisionNumber, leftLabel, rightLabel) =>
        `Vergleich ${decisionNumber}: ${leftLabel} oder ${rightLabel}.`,
    },
    result: {
      changeLastDecision: 'Letzte Entscheidung ändern',
      newRanking: 'Neue Rangliste',
      resultTitle: 'Deine Rangliste',
      copied: 'Kopiert',
      copyList: 'Liste kopieren',
      copyFailed: 'Kopieren ist in diesem Browser gerade nicht möglich.',
    },
    graph: {
      description: (nodeCount, edgeCount) =>
        `${nodeCount} ${nodeCount === 1 ? 'sichtbarer Eintrag' : 'sichtbare Einträge'} und ${edgeCount} ${germanDecisionLabel(edgeCount)}. Pfeile zeigen zum höher eingeordneten Eintrag.`,
      emptyDescription: 'Der Entscheidungsgraph ist noch leer.',
      title: 'Deine Entscheidungen',
      controlsLabel: 'Graphansicht steuern',
      zoomOut: 'Graph verkleinern',
      zoomIn: 'Graph vergrößern',
      fit: 'Einpassen',
      expand: 'Große Graphansicht öffnen',
      collapse: 'Kompakte Graphansicht anzeigen',
      emptyMessage: 'Dein Graph entsteht mit der ersten Entscheidung.',
      renderError:
        'Der Graph konnte gerade nicht dargestellt werden. Deine Entscheidungen bleiben gespeichert.',
      legend: 'Pfeile zeigen zu deinem Favoriten.',
    },
    reset: {
      title: 'Bisherige Entscheidungen löschen?',
      description:
        'Deine Liste bleibt im Eingabefeld erhalten. Die bereits getroffenen Vergleiche lassen sich danach nicht wiederherstellen.',
      cancel: 'Abbrechen',
      confirm: 'Ranking löschen',
    },
  },
  en: {
    sessionSummary: (itemCount, decisionCount) =>
      `${itemCount} ${itemCount === 1 ? 'item' : 'items'} · ${decisionCount} ${englishDecisionLabel(decisionCount)}`,
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
      title: 'New ranking',
      description:
        'Choose your preferred item in each pair.',
      examplesLabel: 'Use an example',
      exampleLabels: {
        'apartment-features': 'Housing',
        'working-conditions': 'Work',
        superpowers: 'Superpowers',
        'essential-inventions': 'Inventions',
        'desert-island': 'Island essentials',
        'travel-destinations': 'Destinations',
        'ice-cream-flavors': 'Ice cream',
      },
      replaceExamples: 'More',
      insertExample: (title) => `Insert the “${title}” example`,
      listLabel: 'Your items',
      itemCount: (count) => `${count} ${count === 1 ? 'item' : 'items'}`,
      help: '2–50 items, one item per line.',
      placeholder: 'Type or paste your list',
      start: 'Compare',
      expectedComparisons: (count) =>
        `About ${count} ${count === 1 ? 'comparison' : 'comparisons'} expected`,
      localNote: 'Saved automatically in this browser.',
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
      progressSummary: (percent) => `${percent}% of the order determined`,
      title: 'Which do you prefer?',
      hint: 'Keep the same criterion in mind.',
      undo: 'Undo',
      editList: 'Edit list',
      liveQuestion: (decisionNumber, leftLabel, rightLabel) =>
        `Comparison ${decisionNumber}: ${leftLabel} or ${rightLabel}.`,
    },
    result: {
      changeLastDecision: 'Change last decision',
      newRanking: 'New ranking',
      resultTitle: 'Your ranking',
      copied: 'Copied',
      copyList: 'Copy list',
      copyFailed: 'Copying is not currently available in this browser.',
    },
    graph: {
      description: (nodeCount, edgeCount) =>
        `${nodeCount} visible ${nodeCount === 1 ? 'item' : 'items'} and ${edgeCount} ${englishDecisionLabel(edgeCount)}. Arrows point to the higher-ranked item.`,
      emptyDescription: 'The decision graph is still empty.',
      title: 'Your decisions',
      controlsLabel: 'Control graph view',
      zoomOut: 'Zoom out',
      zoomIn: 'Zoom in',
      fit: 'Fit to view',
      expand: 'Open large graph view',
      collapse: 'Show compact graph view',
      emptyMessage: 'Your graph will appear after the first decision.',
      renderError:
        'The graph could not be displayed. Your decisions are still saved.',
      legend: 'Arrows point to your preferred item.',
    },
    reset: {
      title: 'Delete previous decisions?',
      description:
        'Your list will remain in the input field. The comparisons you have already made cannot be recovered afterward.',
      cancel: 'Cancel',
      confirm: 'Delete ranking',
    },
  },
} satisfies Readonly<Record<Language, AppCopy>>
