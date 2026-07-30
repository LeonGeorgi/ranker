# Ranker

Ranker erstellt aus einfachen Paarvergleichen eine eindeutige persönliche
Rangliste. Die Anwendung zeigt bereits verglichene Einträge als gerichteten
Graphen, speichert den Fortschritt lokal und lässt Entscheidungen rückgängig
machen. Abgeschlossene Ranglisten bleiben beim Start eines neuen Rankings im
lokalen Verlauf erhalten.

Die Oberfläche ist auf Deutsch und Englisch verfügbar, startet standardmäßig
auf Deutsch und merkt sich die gewählte Sprache separat vom Ranking lokal im
Browser. Das Zurücksetzen eines Rankings behält diese Präferenz bei. Die App
funktioniert ohne Server und basiert auf React, TypeScript, Vite und AntV G6.

## Voraussetzungen

- Node.js 24 oder neuer
- npm 11 oder neuer

## Entwicklung

```sh
npm install
npm run dev
```

Der Entwicklungsserver gibt die lokale URL im Terminal aus.

## Qualitätsprüfungen

```sh
npm run lint
npm run test
npm run build
npm run check
```

`npm run check` führt Linting, die Vitest-Suite, die TypeScript-Prüfung und den
Produktions-Build aus.

## Funktionsweise

- Pro Zeile wird ein Eintrag importiert; zwischen 2 und 50 Einträge sind
  möglich.
- Auf der Startseite werden drei zufällige, lokalisierte Beispiellisten
  angeboten. Sie lassen sich gemeinsam durch drei andere Beispiele ersetzen.
- Jede Antwort erzeugt im Graphen eine Kante vom niedriger eingeordneten zum
  höher eingeordneten Eintrag.
- Neue Zweiergruppen und das Zusammenführen bestehender Rangfolgen wechseln
  sich gewichtet ab. Dadurch werden möglichst wenige Vergleiche gebraucht,
  ohne immer dieselben mittleren Einträge abzufragen.
- Der Start-Button zeigt vorab die gerundete erwartete Anzahl an Vergleichen für
  die aktuelle Listengröße.
- Die Ergebnisansicht wird erst freigegeben, wenn der Graph genau eine
  vollständige Rangfolge zulässt.
- Beim Verlassen einer abgeschlossenen Rangliste wird die vollständige Session
  im lokalen Verlauf archiviert. Der Verlauf ist über die Toolbar erreichbar.
- Liste, Zufalls-Seed und Entscheidungen liegen versioniert im `localStorage`.
  Der aktuelle Vergleich lässt sich daraus deterministisch rekonstruieren.
- Laufende Session und Verlauf verwenden getrennte versionierte
  `localStorage`-Einträge, damit das Zurücksetzen eines Rankings den Verlauf
  nicht löscht.

## Ranking-Simulation

Eine reproduzierbare Monte-Carlo-Simulation zählt die Vergleiche des
balancierten Merge-Verfahrens und prüft dabei sowohl die rekonstruierte
Rangfolge als auch deren Eindeutigkeit im Vergleichsgraphen:

```sh
npm run simulate:ranking
```

Optional lassen sich Umfang, Listenlängen und Seed anpassen, zum Beispiel mit
`npm run simulate:ranking -- --trials=10000 --lengths=10,25,50 --seed=42`.

## Projektstruktur

- `src/main.tsx` bindet React ein und aktiviert den Strict Mode.
- `src/App.tsx` verbindet Sitzungszustand, lokale Speicherung und Ansichten.
- `src/components/` enthält die fokussierten Oberflächenkomponenten.
- `src/ranking/` enthält den deterministischen Ranking-Kern, Validierung,
  Graphableitung, Verlauf und Speicherung sowie die zugehörigen Tests.
- `src/index.css` definiert globale Grundlagen und Design-Tokens.
- `src/App.css` definiert den responsiven Arbeitsbereich.
- `public/og.png` ist das Vorschaubild für geteilte Links.
- `scripts/simulate-ranking.mjs` analysiert den Ranking-Algorithmus.
- `AGENTS.md` dokumentiert die verbindlichen Arbeits- und Wartungsregeln.
