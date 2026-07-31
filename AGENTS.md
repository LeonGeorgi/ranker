# Coding Agent Instructions

## Product context

Ranker turns strict pairwise preferences into one exact personal ranking. A user
pastes one label per line, repeatedly chooses the preferred of two displayed
entries, watches the resulting preference graph grow, and sees the final
best-to-worst order once it is uniquely determined.

The current product scope is deliberately narrow:

- A list contains 2 to 50 non-empty, unique labels. Labels are trimmed, limited
  to 120 characters, and compared case-insensitively with the German locale for
  duplicate detection. More than 30 entries produce a duration warning, not an
  error.
- A comparison is binary. Version 1 has no tie, skip, score, rating, or partial
  result. Adding one of those concepts is a domain and persistence change, not
  merely another button.
- The left and right positions carry no rank meaning and are intentionally
  randomized. The answer records only which entry is better and which is worse.
- Ranker seeks an exact total order. Do not replace the merge-based process with
  Elo, average scores, win counts, or another approximate ranking without an
  explicit product decision.
- The application is local-first and browser-only. It currently has no account,
  backend, sync, sharing, routing, or remote fetching.
- The interface supports German and English. English is the default unless the
  browser's preferred language is German. Keep user-facing copy in `src/i18n.ts`,
  update both languages together, and do not inline localized strings in
  components.

## Ranking model and invariants

`RankingSession` is the canonical persisted state. It contains only the schema
version, deterministic seed, ordered items, and ordered decision log. Current
questions, merge tasks, graph data, progress, and final ranking are derived by
replaying that session and must not become parallel sources of truth.

Preserve these domain contracts:

- The same version, seed, item order, and decisions must produce exactly the
  same next question and `RankingSnapshot`.
- Each `RankingDecision` stores `betterItemId` and `worseItemId`. It must
  match the pair scheduled for that decision number.
- A `RankingQuestion.id` identifies the exact current pair. Stale or duplicate
  UI input must never answer a later question accidentally.
- Undo removes only the final decision. Deterministic replay must then recreate
  the exact previous question, graph, and progress.
- The current engine builds a balanced merge tree over a seeded shuffle. The
  weighted scheduler interleaves unseen `discovery-pair` work with `merge`
  work and penalizes recently shown entries so that the session neither starts
  as a field of disconnected pairs nor repeatedly shows the same middle items.
- Scheduler order may vary, but it must remain within the balanced merge
  comparison bound returned by `getMaximumDecisionCount`.
- The setup estimate is `Math.round(getExpectedDecisionCount(itemCount))`.
  It is the exact mean for the balanced merge process under a uniformly shuffled
  strict total order. Keep this formula and the independent simulation aligned;
  do not present the estimate as a guaranteed decision count.
- `finalRanking` is best to worst and may exist only when the root merge is
  complete and the preference graph has exactly one topological order. A
  connected or fully visible graph alone is not sufficient.
- Progress percentage is the fraction of item pairs whose order is transitively
  derivable from the decisions. It is not the fraction of questions answered,
  visible entries, or merge tasks completed.

Changes to the PRNG, shuffle, merge-tree shape, candidate iteration order,
weights, or number/order of random draws can invalidate replay of existing
stored sessions even if the TypeScript shape is unchanged. Treat such a change
like a persisted-format change: decide explicitly whether to preserve, migrate,
or invalidate old sessions, update the session version and storage key as
needed, and cover the decision with tests.

## Graph semantics

The graph is a permanent visual history of actual user decisions, not a
transitive reduction and not merely the final ranking:

- An item becomes visible only after taking part in at least one completed
  comparison. Once visible, it remains visible unless that decision is undone.
- Every actual decision remains an edge, including transitively redundant ones.
- Edge source is the worse entry and edge target is the preferred entry, so the
  arrow always points to the winner.
- The Dagre layout runs bottom to top so better entries tend to appear higher.
  Layout position is a visualization; the derived ranking remains the source of
  truth.
- The newest edge and currently compared entries receive emphasis. Older edges
  remain readable but subdued.
- The canvas is supplementary. The current question, progress, completion gate,
  and final order must remain available as semantic HTML.
- A G6 loading or render failure must never discard, block, or fabricate ranking
  decisions.

## Application phases and user-data behavior

Keep the three observable phases distinct:

1. Setup: no session exists; the user edits and validates a newline-separated
   draft.
2. Comparing: a session exists, `currentQuestion` exists, and no final ranking
   is available.
3. Result: the final ranking is unique, immediately visible, and can be copied.

The transition from comparing to result uses a brief, non-blocking reveal
animation that is disabled when reduced motion is preferred. Reloading a
completed session shows the result. Undo from the result returns to the exact
preceding comparison.

Completed results are archived immediately as algorithm-independent snapshots
containing the final labels, completion time, and decision count. Keep at most
50 history entries and migrate legacy v1 session archives without deleting the
legacy key. Copying a result writes the unchanged labels best-to-worst, one per
line, so the output can be used as Ranker input again.

Changing the list during an incomplete session after at least one decision
requires confirmation. Starting a new ranking from a completed result does not.
Resetting clears the active session and its stored decisions but keeps the
labels in the draft.
Storage failure is non-fatal: ranking continues in memory and the interface must
show that progress is only temporary. Corrupt stored data and unavailable
storage are separate conditions and must not be presented as successful restore.

## Project map and boundaries

- `src/main.tsx` owns the React root, Strict Mode, and application-wide
  providers if one becomes necessary.
- `src/App.tsx` composes the three phases, owns the canonical session, and
  synchronizes it with local storage.
- `src/components/ListSetup.tsx` owns input feedback and submission.
- `src/components/ComparisonPanel.tsx` owns the current binary choice,
  keyboard shortcuts, progress display, undo, and list-change action.
- `src/components/RankingResult.tsx` owns the semantic ordered result,
  clipboard feedback, and result actions.
- `src/components/RankingGraph.tsx` is the only imperative G6 boundary. It
  dynamically loads G6, serializes renders, responds to size and color-scheme
  changes, and destroys its graph safely under React Strict Mode.
- `src/ranking/session.ts` owns creation, validation, replay, scheduling,
  answering, undo, and serialization of sessions.
- `src/ranking/graph.ts` derives visible graph data, reachability progress,
  connected components, and the unique topological ranking.
- `src/ranking/input.ts` validates user-entered labels, keeps German
  case-folding semantics for duplicates, and selects localized feedback;
  `src/ranking/storage.ts` is the guarded local-storage boundary.
- `src/ranking/history.ts` owns the bounded, versioned completed-result
  snapshots and migration from legacy replay-based history.
- `src/ranking/types.ts` defines shared domain vocabulary and persisted
  version/limit constants. `src/ranking/random.ts` is the deterministic PRNG.
- `src/i18n.ts` is the complete German/English copy contract;
  `src/language-storage.ts` persists the language independently of a ranking.
- `scripts/simulate-ranking.mjs` independently analyzes comparison counts for
  the balanced merge process. It can drift from production and must be reviewed
  whenever the algorithm or limits change.
- `src/index.css` owns global foundations and design tokens. Component-specific
  presentation stays next to its component.

The project is browser-only ESM. Do not introduce a server, router, global state
library, fetching layer, or component framework before a concrete requirement
needs it.

Write code according to clean-code principles: keep it simple, readable,
well-named, focused, and consistent with the existing project style.

## Before changing code

- Read the relevant implementation, its callers, tests, and nearby conventions.
  Let the repository answer questions it can answer.
- When this directory is a Git repository, confirm the root and current branch,
  then check `git status --short`. Preserve user changes and unrelated work.
- Define the observable outcome and how it will be verified before implementing
  a non-trivial change.
- State assumptions only when they materially affect behavior, architecture, or
  scope. Ask only when different plausible answers require meaningfully
  different implementations.
- Preserve existing behavior unless changing it is part of the request. Surface
  conflicts between the request and current behavior explicitly.

## Scope and simplicity

- Build the smallest clear solution that fully solves the requested problem.
  Optimize for the fewest concepts a reader must hold in their head, not the
  fewest lines.
- Every changed line should have a direct reason to exist. Do not add speculative
  features, configurability, compatibility layers, or abstractions for possible
  future work.
- Do not introduce a dependency when the platform or repository can express the
  behavior clearly without it. Explain the concrete value of any new dependency.
- Do not refactor, reformat, or improve adjacent code unless the requested change
  needs it.
- Prefer removing an obsolete path over adding a parallel source of truth.
  Remove imports, branches, helpers, styles, and comments made obsolete by the
  current change; leave unrelated pre-existing dead code alone.
- Push back when an approach creates avoidable scope, complexity, public API
  surface, data-loss risk, or verification cost. Offer the smaller path that
  still satisfies the goal.

## Architecture and data flow

- Keep `src/ranking/` browser- and React-independent. Domain behavior should be
  testable with plain data and pure functions.
- Derive `RankingSnapshot` from `RankingSession`; do not store the current
  question, graph, progress, merge state, or result separately.
- Keep time, browser APIs, local storage, clipboard access, G6, and cryptographic
  seed generation at explicit UI or infrastructure boundaries.
- Keep components focused on one clear responsibility. Split a component when
  doing so clarifies ownership or behavior, not merely because it has grown to
  an arbitrary line count.
- Keep state with its nearest responsible owner. Derive values instead of
  storing duplicate state, and keep data flow explicit.
- Prefer pure functions for domain rules. Keep networking, storage, time,
  randomness, browser APIs, and other side effects at clear boundaries so core
  behavior remains deterministic and testable.
- Add an abstraction only when it names a stable domain concept, centralizes an
  invariant, isolates a side effect, or removes repeated non-trivial logic that
  would otherwise drift.
- Avoid premature `utils`, manager or service layers, generic factories, global
  stores, and wrapper components that only forward arguments. An abstraction
  should reduce decisions at its call sites.
- Treat remote responses, URL state, local storage, and environment variables as
  external input. Validate them at the boundary and model failure explicitly.

## TypeScript and React

- Preserve the strict TypeScript configuration. Do not use `any`, unchecked
  casts, non-null assertions, disabled lint rules, or `@ts-ignore` to bypass a
  design problem. If an escape hatch is unavoidable, keep it narrow and explain
  the external constraint.
- Use the established domain terms: session, item, decision, question,
  discovery pair, merge, snapshot, comparison edge, and final ranking. Preserve
  the semantic distinction between preferred/better and less-preferred/worse
  entries.
- Prefer function components, semantic HTML, and platform behavior. Use effects
  only to synchronize with systems outside React; do not use them for derived
  state or ordinary event handling.
- Respect React Strict Mode. Effects and cleanup must tolerate development
  remounts, and asynchronous work must not update stale owners.
- Keep loading, empty, success, error, offline, and partial states distinct when
  a feature can encounter them. Never turn a failure into plausible-looking
  success.
- Comments should explain a non-obvious reason, invariant, unit, or external
  constraint rather than restating the code.

## Product and UI quality

- Preserve equal visual weight for the two choice buttons. Do not style either
  side as the likely or default winner.
- Keyboard controls are `1`/`ArrowLeft` for the displayed left entry and
  `2`/`ArrowRight` for the displayed right entry. Ignore key repeat and do
  not trigger shortcuts while the user is typing in an editable control.
- Do not expose a ranking before the uniqueness gate. The graph may look ordered
  before the domain can prove a single total order.
- Keep the graph visible throughout comparing and result phases. On
  narrow screens the comparison/result content appears before the graph.
- Treat the interface as a polished product, even while it is small. Favor clear
  hierarchy, restrained styling, balanced spacing, and predictable behavior.
- Use semantic elements first. All interactive controls must work with keyboard
  and touch, expose an accessible name, and show a visible focus state.
- Consider responsive layouts, zoom, readable contrast, reduced motion, and
  light and dark color schemes when they are relevant to the changed interface.
- Keep animations brief and non-blocking. Controls and content must not require
  waiting for an animation before they become usable.
- Do not automatically add cards, rounded containers, gradients, shadows,
  animations, or custom controls. Visual treatment must serve a structural or
  semantic purpose.
- For visual changes, inspect the rendered page when the available environment
  permits it. Check the browser console and at least a narrow and wide viewport;
  do not claim visual quality was verified from source code alone.

## Dependencies, configuration, and data safety

- The persisted schema is coupled to `RANKING_SESSION_VERSION` and
  `RANKING_STORAGE_KEY` (`ranker.ranking-session.v1`). Change version,
  validation, migration/invalidating behavior, key, tests, and documentation
  together.
- Completed history uses its own version and storage key. A schema change must
  update both together and preserve or explicitly migrate existing entries.
- Treat local storage as untrusted and failure-prone. Reading, writing, and
  clearing must remain exception-safe; never let persistence failure stop an
  in-memory ranking.
- The graph uses AntV G6 5.x. Do not copy 4.x lifecycle or configuration
  examples. Preserve stable node/edge IDs, the serialized latest-data render
  queue, `ResizeObserver`, reduced-motion handling, and `destroy()` cleanup.
- G6 is intentionally loaded with a dynamic import only after graph nodes exist.
  Its large lazy chunk is a known build warning; do not silence the warning or
  move G6 into the initial bundle without measuring the trade-off.
- Keep runtime dependencies few and the lockfile committed. Use npm unless the
  repository deliberately migrates package managers.
- Never place secrets in source code or commit local `.env` files. Remember that
  `VITE_` variables are included in client bundles and are therefore public.
- Handle destructive actions, persistence changes, imports, and migrations with
  particular care. Preserve user data, support partial failure where relevant,
  and add focused coverage for data-loss risks.
- Keep generated output such as `dist/` and `node_modules/` untracked. Do not
  edit generated artifacts by hand.

## Verification and maintenance

Verify in proportion to the change, starting with the narrowest relevant check.

- `npm run lint` runs the type-aware static analysis.
- `npm run test` runs the established Vitest domain and boundary tests.
- `npm run build` runs the TypeScript project build and Vite production build.
- `npm run check` is the ordinary complete local verification for the current
  project: lint, tests, and build.
- `npm run simulate:ranking` runs the reproducible Monte Carlo comparison-count
  analysis. Run it when changing the merge strategy or its claimed efficiency.
- Changes to scheduling, random calls, replay, or serialization need focused
  tests for same-seed determinism, serialization round trips, exact undo,
  stale/invalid answers, odd and even list sizes, comparison bounds, and
  completion with a unique best-to-worst order.
- Comparison-estimate changes need known exact values, supported-size bounds,
  localized singular/plural copy, and a consistency check against the
  simulation model.
- Graph changes need coverage for winner-pointing edges, permanent actual
  decisions, visibility after first comparison, transitive progress, cycles or
  ambiguous topologies, and undo.
- Input or persistence changes need coverage for limits, German
  case-insensitive duplicates and line numbers, corrupt data, unsupported
  versions, unavailable storage, and non-destructive failure.
- Automated UI tests are not established yet. Add Vitest and Testing Library
  coverage when interaction complexity or a regression justifies it; do not
  substitute source inspection for browser verification of visual behavior.
- For graph or layout changes, exercise at least setup, first decision, a dense
  intermediate graph, and result state. Inspect a narrow and wide viewport,
  reduced motion where relevant, and the browser console.
- Add or update focused tests for non-trivial logic and regressions. Test
  observable behavior and domain contracts, not private implementation details.
- Do not claim a test, build, or visual check ran when it did not. Respect an
  explicit request not to run verification.
- Before handing off, review the diff for accidental scope growth, unrelated
  formatting, duplicated logic, newly dead code, hidden assumptions, and
  avoidable additions.
- Report what changed, what was verified, and which relevant verification
  remains outstanding.
- Keep `README.md`, this file, input copy, domain constants, storage version,
  simulation script, supported Node versions, and actual project structure
  aligned as the application evolves. Delete stale guidance instead of layering
  new instructions over obsolete ones.
