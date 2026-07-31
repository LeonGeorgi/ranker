# Ranker

Ranker turns simple head-to-head choices into one exact personal ranking. As you
compare items, the app builds a directed decision graph, saves your progress
locally, and lets you undo your latest choice. Completed rankings are added to
a local history as soon as they are finished.

The interface is available in English and German. It starts in English unless
the browser prefers German, remembers the selected language independently of a
ranking, and offers system, light, and dark themes. Ranker runs entirely in the
browser without an account, backend, or network requests.

## Features

- Paste one item per line and rank between 2 and 50 unique items. Labels are
  trimmed and limited to 120 characters; lists with more than 30 items show a
  duration warning.
- Start from one of three randomly selected, localized example lists and replace
  all three with another set at any time.
- Choose the preferred item with the buttons, `1` and `2`, or the left and right
  arrow keys.
- Follow the permanent history of actual decisions in a directed graph. Every
  arrow points from the less-preferred item to the preferred item.
- See how much of the final order can already be derived transitively, and undo
  the most recent decision at any time.
- See the final best-to-worst order immediately, with a brief reveal animation,
  once it is uniquely determined, then copy one reusable label per line.
- Keep the active session and up to 50 completed ranking snapshots in separate,
  versioned `localStorage` entries. Resetting an active ranking does not clear
  the history.
- Continue in memory if browser storage is unavailable; the interface reports
  that the current data is temporary.

## How ranking works

Ranker creates a balanced merge tree over a seeded shuffle of the input. A
weighted scheduler interleaves new discovery pairs with merge comparisons and
avoids repeatedly showing the same items. This produces an exact total order;
it is not an Elo rating, score, or win-count approximation.

The start button shows the rounded expected number of comparisons for the
current list size. This estimate is the exact mean of the balanced merge process
under a uniformly shuffled strict order, not a guaranteed number of questions.
The final ranking becomes available only when the merge is complete and the
decision graph admits exactly one topological order.

The session stores only the schema version, deterministic seed, ordered items,
and decision log. Questions, graph data, progress, and the result are derived by
replaying that canonical state, so reloading and undoing remain deterministic.
Completed history entries store only their final label order, completion time,
and decision count, so viewing old results does not depend on replaying the
ranking algorithm.

## Requirements

- Node.js 24 or newer
- npm 11 or newer

## Local development

```sh
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Verification

```sh
npm run lint
npm run test
npm run build
npm run check
```

`npm run check` is the complete local verification command. It runs ESLint, the
Vitest suite, the TypeScript build, and the Vite production build.

## Ranking simulation

The reproducible Monte Carlo simulation measures comparison counts for the
balanced merge process and verifies both the recovered order and its uniqueness
in the comparison graph:

```sh
npm run simulate:ranking
```

The number of trials, list sizes, and seed are configurable. For example:

```sh
npm run simulate:ranking -- --trials=10000 --lengths=10,25,50 --seed=42
```

## Project structure

- `src/main.tsx` mounts React and enables Strict Mode.
- `src/App.tsx` coordinates the application phases, canonical session, local
  persistence, language, theme, and history.
- `src/components/` contains the focused interface components, including the
  comparison panel, decision graph, result, and ranking-history dialog.
- `src/ranking/` contains the deterministic ranking engine, input validation,
  graph derivation, history, persistence boundaries, and their tests.
- `src/i18n.ts` contains all English and German interface copy.
- `src/index.css` defines global foundations and design tokens; `src/App.css`
  defines the responsive workspace.
- `public/og.png` is the social-sharing preview image.
- `scripts/simulate-ranking.mjs` independently analyzes the ranking algorithm.
- `AGENTS.md` documents the project's implementation and maintenance rules.
