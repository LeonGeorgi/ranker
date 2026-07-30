export type Language = 'de' | 'en'

export const DEFAULT_LANGUAGE: Language = 'de'

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
    readonly stored: string
    readonly temporary: string
    readonly tagline: string
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
    readonly discoveryPair: string
    readonly merge: string
    readonly visibleItems: (totalCount: number) => string
    readonly decisionsLabel: (count: number) => string
    readonly progressLabel: string
    readonly determinedProgress: (percent: number) => string
    readonly title: string
    readonly hint: string
    readonly divider: string
    readonly keyboardTip: string
    readonly undo: string
    readonly editList: string
    readonly liveQuestion: (
      decisionNumber: number,
      leftLabel: string,
      rightLabel: string,
    ) => string
  }
  readonly result: {
    readonly readyKicker: string
    readonly readyTitle: string
    readonly readyDescription: (decisionCount: number) => string
    readonly reveal: string
    readonly changeLastDecision: string
    readonly newRanking: string
    readonly readyAnnouncement: string
    readonly resultKicker: string
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
      stored: 'Lokal gespeichert',
      temporary: 'Nur temporär',
      tagline: 'Direkt vergleichen. Klar entscheiden.',
    },
    storage: {
      invalid: 'Der frühere Speicherstand war beschädigt und wurde ignoriert.',
      unavailable: 'Lokales Speichern ist in diesem Browser nicht verfügbar.',
      writeFailed: 'Dein Fortschritt konnte nicht lokal gespeichert werden.',
    },
    setup: {
      kicker: 'Neue Rangliste',
      title: 'Was gewinnt?',
      description:
        'Füge deine Auswahl ein und entscheide jeweils nach deinem eigenen Kriterium. Ranker baut daraus Schritt für Schritt eine eindeutige Reihenfolge.',
      examplesLabel: 'Womit möchtest du anfangen?',
      replaceExamples: 'Ersetzen',
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
      discoveryPair: 'Ein neues Paar kommt dazu',
      merge: 'Zwei Gruppen werden zusammengeführt',
      visibleItems: (totalCount) => `von ${totalCount} im Graph`,
      decisionsLabel: germanDecisionLabel,
      progressLabel: 'Ableitbare Rangfolge',
      determinedProgress: (percent) =>
        `${percent} % der Paarbeziehungen sind bereits ableitbar.`,
      title: 'Was gewinnt?',
      hint:
        'Entscheide nach deinem Kriterium. Ein Unentschieden gibt es in dieser Version nicht.',
      divider: 'oder',
      keyboardTip: 'Tipp: Nutze 1 und 2 oder die Pfeiltasten.',
      undo: 'Rückgängig',
      editList: 'Liste ändern',
      liveQuestion: (decisionNumber, leftLabel, rightLabel) =>
        `Vergleich ${decisionNumber}: ${leftLabel} oder ${rightLabel}.`,
    },
    result: {
      readyKicker: 'Geschafft',
      readyTitle: 'Deine Rangfolge ist eindeutig.',
      readyDescription: (decisionCount) =>
        `Nach ${decisionCount} ${germanDecisionLabel(decisionCount)} lässt sich jeder Eintrag klar einordnen. Jetzt kannst du das Ergebnis aufdecken.`,
      reveal: 'Rangliste anzeigen',
      changeLastDecision: 'Letzte Entscheidung ändern',
      newRanking: 'Neues Ranking',
      readyAnnouncement:
        'Die Rangfolge ist eindeutig. Du kannst die Rangliste jetzt anzeigen.',
      resultKicker: 'Dein Ergebnis',
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
      stored: 'Saved locally',
      temporary: 'Temporary only',
      tagline: 'Compare directly. Decide clearly.',
    },
    storage: {
      invalid: 'The previous saved session was corrupted and has been ignored.',
      unavailable: 'Local storage is not available in this browser.',
      writeFailed: 'Your progress could not be saved locally.',
    },
    setup: {
      kicker: 'New ranking',
      title: 'What wins?',
      description:
        'Add your choices and decide each comparison using your own criterion. Ranker turns those decisions into one definitive order, step by step.',
      examplesLabel: 'What would you like to rank?',
      replaceExamples: 'Replace',
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
      discoveryPair: 'A new pair joins the graph',
      merge: 'Two groups are being merged',
      visibleItems: (totalCount) => `of ${totalCount} in the graph`,
      decisionsLabel: englishDecisionLabel,
      progressLabel: 'Determined pairwise order',
      determinedProgress: (percent) =>
        `${percent}% of pairwise relationships are already determined.`,
      title: 'What wins?',
      hint:
        'Use your criterion to decide. Ties are not available in this version.',
      divider: 'or',
      keyboardTip: 'Tip: Use 1 and 2 or the arrow keys.',
      undo: 'Undo',
      editList: 'Edit list',
      liveQuestion: (decisionNumber, leftLabel, rightLabel) =>
        `Comparison ${decisionNumber}: ${leftLabel} or ${rightLabel}.`,
    },
    result: {
      readyKicker: 'Done',
      readyTitle: 'Your ranking is uniquely determined.',
      readyDescription: (decisionCount) =>
        `After ${decisionCount} ${englishDecisionLabel(decisionCount)}, every item has a clear place. You can now reveal the result.`,
      reveal: 'Reveal ranking',
      changeLastDecision: 'Change last decision',
      newRanking: 'New ranking',
      readyAnnouncement:
        'The ranking is uniquely determined. You can reveal it now.',
      resultKicker: 'Your result',
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
