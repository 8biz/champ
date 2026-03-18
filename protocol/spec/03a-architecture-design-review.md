# Architecture and Design Review — CHAMP Protocol

This document provides an in-depth architecture and design review of the CHAMP Protocol application (`protocol/protocol.html`), a single-file HTML5 app for live recording of wrestling bouts.

The review evaluates the current design against established software engineering principles — DDD, SOLID, DRY, KISS, YAGNI, event sourcing, separation of concerns, and functional programming idioms — and offers concrete, actionable recommendations for improvement.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Overview](#2-current-architecture-overview)
3. [State Management](#3-state-management)
4. [Event Sourcing Analysis](#4-event-sourcing-analysis)
5. [Separation of Concerns](#5-separation-of-concerns)
6. [SOLID Principles](#6-solid-principles)
7. [DRY Analysis](#7-dry-analysis)
8. [KISS and YAGNI](#8-kiss-and-yagni)
9. [Functional Programming Opportunities](#9-functional-programming-opportunities)
10. [Domain-Driven Design](#10-domain-driven-design)
11. [Code Structure and Organization](#11-code-structure-and-organization)
12. [Performance Considerations](#12-performance-considerations)
13. [Testability](#13-testability)
14. [Recommendations Summary](#14-recommendations-summary)
15. [Proposed Refactored Architecture](#15-proposed-refactored-architecture)

---

## 1. Executive Summary

The CHAMP Protocol is a well-structured single-file HTML5 app with solid domain coverage. Its approximately 4,500 lines of inline HTML, CSS, and JavaScript deliver a complete bout-recording workflow: preparation, real-time event recording, multi-mode correction, completion, and JSON export.

**Strengths:**
- The event log as append-only source of truth is a strong foundation for event sourcing
- Clear five-state lifecycle (New → Recording → Completing → Completed → Re-released)
- Effective keyboard-first UX with button fallbacks
- Comprehensive test coverage via Playwright E2E tests
- Offline-capable, zero-dependency design
- Pure domain namespaces (`Fmt`, `EventType`, `Score`, `Ruleset`, `Projection`, `ExportBuilder`, `CorrectionSM`) enforce separation of concerns
- Formal `CorrectionSM` state machine eliminates illegal boolean combinations
- Central `dispatch()` entry point for all bout commands
- Per-render projection cache eliminates redundant recomputation
- `appState` split into focused domain sub-objects (`timers`, `correction`, `completion`)

**Remaining Concerns:**
- No unit tests possible for browser-specific code (all logic depends on the DOM and global state)
- `confirmTimeModChange()` still routes through a dispatcher function (split into context helpers — see §6.1)
- `appState` mutations remain direct (no pure command/event pipeline at the infrastructure level)

> **Note:** This review was written against an early prototype. Sections that have since been resolved by the incremental refactoring series (Refactor-01 through Refactor-14) are annotated with ✅ **RESOLVED** inline.

---

## 2. Current Architecture Overview

![Current Architecture](img/current-architecture.png)

The entire application lives in a single HTML file with three inline sections:

| Section | Approximate Lines | Purpose |
|---|---|---|
| HTML markup | ~110 | Semantic structure, UI elements |
| CSS `<style>` | ~740 | All styles inline |
| JSON `<script>` | ~50 | Embedded default ruleset |
| JS `<script>` | ~3,300 | All application logic |

The JavaScript is organized into labeled sections via comment banners (`// === SECTION ===`):

```
APP STATE → TIMER LOGIC → INJURY TIMER → ACTIVITY TIMER →
EVENT RECORDING → STATE MANAGEMENT → SCORE CALCULATION →
TIMELINE RENDERING → NEXT-EVENT DISPLAY → KEYBOARD INPUT →
CORRECTION MODE → EVENT BUTTON HANDLERS → CONTEXT MENU →
TIMELINE INTERACTION → RULESET HELPER → EXPORT → INITIALIZATION
```

While the comment-based sectioning provides navigational hints, there is no actual encapsulation boundary between sections. Every function can (and does) freely access `appState` and any other function.

### Advantages of Current Design
- **Simplicity**: Zero build tools, zero dependencies, one file to deploy
- **Discoverability**: Everything is in one place; `Ctrl+F` works
- **Constraint-aligned**: Matches the "single-file offline" requirement perfectly

### Disadvantages
- **Cognitive load**: Understanding any one feature requires tracing through many interleaved concerns
- **Change amplification**: Modifying event handling often requires touching timer, score, timeline, and correction code
- **Testing difficulty**: No unit-testable modules; everything depends on the DOM

---

## 3. State Management

### 3.1 The `appState` Object — ✅ RESOLVED (Refactor-06, Refactor-14)

`appState` has been reorganised into focused domain sub-objects. The flat "God Object" with 25+ fields has been replaced by three typed sub-objects plus shared scalar fields:

```javascript
const appState = {
  mode: 'New',                     // top-level lifecycle mode
  sequenceCounter: 0,
  events: [],
  createdAt: null,
  keyBuffer: [],
  currentPeriodIndex: 0,
  injuryTimers: { IR: {...}, IB: {...}, BR: {...}, BB: {...} },
  activityTimers: { AR: {...}, AB: {...} },

  timers: {
    running: false,          // was: timerRunning
    intervalId: null,        // was: timerIntervalId
    boutTime100ms: 0,        // was: boutTime100ms (flat)
    periodTime100ms: 1800,   // was: periodTime100ms (flat)
    breakRunning: false,     // was: breakTimerRunning
    breakTime100ms: 0        // was: breakTime100ms (flat)
  },

  correction: {
    active: false,           // was: inCorrectionMode
    insertMode: false,       // was: inInsertMode
    swapMode: false,         // was: inSwapMode
    swapOriginIndex: null,   // was: swapOriginIndex
    cursorIndex: null,       // was: cursorIndex
    buffer: [],              // was: correctionBuffer
    timeModTarget: null,     // was: timeModTarget
    timeModEvent: null       // was: timeModCorrectionEvent
  },

  completion: {
    done: false,             // was: completed
    at: null,                // was: completedAt
    winner: null,
    victoryType: null,
    victoryDescription: null,
    classificationPoints: null,
    boutTime100ms: null      // was: complBoutTime100ms
  }
};
```

Domain accessor helpers expose the sub-objects cleanly:

```javascript
function getTimers()     { return appState.timers; }
function getCorrection() { return appState.correction; }
function getCompletion() { return appState.completion; }
```

### 3.2 Mode Management — ✅ RESOLVED (Refactor-09)

The ad-hoc boolean correction sub-mode flags have been replaced by the `CorrectionSM` formal state machine:

```javascript
// CorrectionSM — four legal states: 'idle' | 'cursor' | 'insert' | 'swap'
CorrectionSM.apply('cursor');   // transition
CorrectionSM.is('swap');        // predicate
CorrectionSM.get();             // current state string
```

Illegal combinations (e.g. `inSwapMode = true` without `inCorrectionMode = true`) are structurally impossible. The state machine is exposed on `window.CorrectionSM` for tests.

![State Machine](img/state-machine.png)

---

## 4. Event Sourcing Analysis

The application's event log is its most architecturally sound element. Events are append-only and serve as the single source of truth — a natural fit for event sourcing.

### 4.1 What Works Well

- **Append-only log**: `recordEvent()` only pushes, never modifies existing entries
- **Corrections as events**: `EventModified`, `EventDeleted`, `EventInserted`, and `EventSwapped` preserve full audit history
- **Derived state**: Scores and the timeline are computed from events via `getEffectiveBoutEvents()` and `calculateScores()`

### 4.2 What Could Be Improved — ✅ All three items RESOLVED

**1. No explicit Event type hierarchy — ✅ RESOLVED (Refactor-13)**

The `EventType` namespace centralises all event-type knowledge:

```javascript
EventType.parsePoint(type)       // { points, side } | null
EventType.parsePassivity(type)   // { side } | null
EventType.parseActivity(type)    // { side } | null
EventType.parseCaution(type)     // { cautionedSide, points, recipientSide } | null
EventType.isRawBout(event)       // true for storable bout events
EventType.colorClass(type)       // 'red' | 'blue' | 'next'
EventType.isCorrectionEvent(t)   // true for EventModified/Deleted/Inserted/Swapped
EventType.isTimerEvent(t)        // true for T_* events
```

**2. No projections / read models — ✅ RESOLVED (Refactor-05, Refactor-07)**

`Projection.compute()` is the single projection function (with `annotate` flag for rendering mode).
A per-render-cycle cache (`_projectionCache`) ensures at most one recomputation per state change.
`getEffectiveBoutEvents()` and `getBoutEventsForTimelineRendering()` are thin wrappers that share the cache.

**3. No command/event separation — ✅ RESOLVED (Refactor-12)**

`dispatch(command)` is the central entry point for all bout commands, exposed as `window.testHelper.dispatch` for tests.

---

## 5. Separation of Concerns

### 5.1 Current Coupling

![Event Flow](img/event-flow.png)

The codebase intermixes four distinct concerns:

| Concern | Should Be Isolated? | Currently Isolated? |
|---|---|---|
| **Domain Logic** (scoring, corrections, rulesets) | Yes | No — calls DOM APIs |
| **State Management** (modes, transitions) | Yes | No — mixed into event handlers |
| **Input Handling** (keyboard, mouse, touch) | Yes | No — contains business logic |
| **Presentation** (DOM manipulation, rendering) | Yes | No — called from domain functions |

Example of tight coupling in `recordEvent()`:

```javascript
function recordEvent(eventData) {
  appState.sequenceCounter++;                    // Domain: sequence generation
  const event = { seq: ..., timestamp: ..., ...eventData };
  appState.events.push(event);                   // Domain: event log append
  // ... activity timer logic ...                // Domain: timer side effect
  updateScores();                                // Presentation: DOM update
  updateTimeline();                              // Presentation: DOM update
  console.log('Event recorded:', event);         // Infrastructure: logging
  return event;
}
```

### 5.2 Timeline Rendering Dual Path — ✅ RESOLVED (Refactor-07)

`getEffectiveBoutEvents()` and `getBoutEventsForTimelineRendering()` now both delegate to `Projection.compute()` with a boolean `annotate` flag. A shared projection cache ensures the common computation path runs at most once per render cycle.

---

## 6. SOLID Principles

### 6.1 Single Responsibility Principle (SRP) — Partially Resolved

Most functions carry multiple responsibilities:

| Function | Responsibilities |
|---|---|
| `tick()` | Advance bout timer, advance activity timers, check period end, trigger break, update display |
| `confirmTimeModChange()` | Parse input, dispatch to context-specific handler (✅ split into `applyCompletionBoutTimeMod`, `applyCorrectionBoutTimeMod`, `applyInjuryTimeMod`, `applyLiveBoutTimeMod`) |
| `exitCorrectionMode()` | Convert buffer to events, clear mode flags, hide context menu, update timeline, update scores |

### 6.2 Open/Closed Principle (OCP) — Partially Violated

Adding a new event type requires changes in:
- `processKeySequence()` — input recognition
- `calculateScores()` — scoring
- `calculateStatistics()` — statistics
- `createTimelineEntry()` — rendering
- `eventColorClass()` — styling
- `getEventMainColor()` / `modifyEventColor()` etc. — correction utilities

This is a classic OCP violation. An event-type registry pattern would allow adding events without modifying existing code:

```javascript
const eventTypes = {
  '1R': { side: 'red', points: 1, render: renderPointEntry, keys: ['1', 'R'] },
  'PR': { side: 'red', points: 0, render: renderPassivityEntry, keys: ['P', 'R'] },
  // ... extensible without modifying core logic
};
```

### 6.3 Dependency Inversion Principle (DIP) — Violated

All functions directly depend on:
- The global `appState` object
- DOM queries (`document.getElementById(...)`)
- The embedded ruleset (`loadEmbeddedRuleset()` re-parses JSON on every call)

There is no dependency injection or abstraction layer between the domain and infrastructure.

---

## 7. DRY Analysis

### 7.1 Duplicated Event Filtering — ✅ RESOLVED (Refactor-07, Refactor-13)

`EventType.isRawBout(e)` is the single canonical predicate for storable bout events.
`Projection.compute()` uses it internally; no duplication remains.

### 7.2 Duplicated Regex Patterns — ✅ RESOLVED (Refactor-13)

All event-type parsing is centralised in the `EventType` namespace.
`EventType.parsePoint()`, `parsePassivity()`, `parseCaution()`, and `parseActivity()` replace the 8+ regex occurrences that previously appeared across scoring, statistics, rendering, and correction helpers.

### 7.3 Duplicated Time Formatting — ✅ RESOLVED (Refactor-02)

`Fmt.time100ms()` (M:SS.f) and `Fmt.mmss()` (M:SS) are the only two formatting functions.
The `formatInjuryTime()` duplicate has been removed.

### 7.4 `loadEmbeddedRuleset()` Called Repeatedly — ✅ RESOLVED (Refactor-04)

`Ruleset` is an IIFE with an internal `_cache` variable. The JSON is parsed once on first call; every subsequent call returns the cached object without re-parsing.

---

## 8. KISS and YAGNI

### 8.1 KISS — Mostly Followed

The overall design is pleasantly simple for a prototype:
- No framework, no build step, no abstractions for abstraction's sake
- Direct DOM manipulation is straightforward
- The keyboard input model (buffer → process → clear) is elegant

However, some areas have grown complex:
- `getEffectiveBoutEvents()` is 120 lines of interleaved filtering, mapping, and mutation
- The correction system has 3 sub-modes (edit, swap, insert) plus time modification, each with separate key handlers
- `confirmTimeModChange()` handles 5 distinct contexts in one 150-line function

### 8.2 YAGNI — Generally Followed

The codebase does not over-engineer. Notable examples of restraint:
- No undo/redo system (corrections are the undo mechanism)
- No offline storage / IndexedDB (the export is the persistence mechanism)
- No templating engine or virtual DOM

One area that may violate YAGNI: the `window.testHelper` object exposes 8 methods that manipulate internal state. While useful for E2E testing, it creates a secondary API surface that must be maintained.

---

## 9. Functional Programming Opportunities

### 9.1 Current Functional Elements

The codebase already uses some functional patterns:
- `Array.filter()`, `.map()`, `.forEach()` for event processing
- `calculateScores()` is a pure function (given events, returns scores)
- `evaluateCondition()` is a pure function
- Key buffer as immutable-style sequence processing

### 9.2 Side Effects in Core Logic

Several conceptually pure functions have side effects:

```javascript
function recordEvent(eventData) {
  appState.sequenceCounter++;        // mutation
  appState.events.push(event);       // mutation
  deleteActivityTimer(...);          // side effect
  updateScores();                    // DOM side effect
  updateTimeline();                  // DOM side effect
}
```

**Recommendation**: Separate computation from effects:

```javascript
// Pure: compute the new event
function createEvent(eventData, state) {
  return { seq: state.sequenceCounter + 1, timestamp: new Date().toISOString(), ...eventData };
}

// Effectful: apply the event and update UI
function commitEvent(event) {
  appState.events.push(event);
  appState.sequenceCounter = event.seq;
  updateScores();
  updateTimeline();
}
```

### 9.3 Memoization Opportunities

`getEffectiveBoutEvents()` is deterministic given `appState.events` and `appState.correctionBuffer`. It could be memoized:

```javascript
let _effectiveEventsCache = null;
let _effectiveEventsCacheKey = null;

function getEffectiveBoutEvents() {
  const key = `${appState.events.length}-${appState.correctionBuffer.length}`;
  if (key === _effectiveEventsCacheKey) return _effectiveEventsCache;
  _effectiveEventsCache = computeEffectiveBoutEvents();
  _effectiveEventsCacheKey = key;
  return _effectiveEventsCache;
}
```

This would reduce the per-action overhead from 3-5 full recomputations to 1.

---

## 10. Domain-Driven Design

### 10.1 Implicit Domain Model

The application has a rich domain that is entirely implicit:

| Domain Concept | Current Representation |
|---|---|
| Bout Event | Plain object `{seq, timestamp, eventType, boutTime100ms}` |
| Event Log | `appState.events` (raw array) |
| Score | Two integers returned by `calculateScores()` |
| Timer | Scattered across `appState.timerRunning`, `appState.injuryTimers`, etc. |
| Correction | Heterogeneous objects in `appState.correctionBuffer` |
| Ruleset | JSON parsed ad-hoc via `loadEmbeddedRuleset()` |
| Scoresheet Mode | `appState.mode` string + boolean flags |

### 10.2 Missing Aggregates

The spec defines clear aggregate boundaries:
- **Event Log**: Append-only, owns sequence counter, source of truth
- **Timer Manager**: Owns bout time, period time, injury timers, activity timers
- **Correction Session**: Owns buffer, cursor, sub-mode state, and commit/cancel lifecycle
- **Scoresheet**: Owns mode transitions and invariants (e.g., "cannot record in Completed mode")

Currently these are all merged into the flat `appState`.

### 10.3 Missing Value Objects

Event types, scores, and time values have no type safety:

```javascript
// Current: stringly-typed, no validation
recordEvent({ eventType: '3R', boutTime100ms: -5 }); // silently accepted
```

A value object approach would prevent invalid states:

```javascript
class BoutTime {
  constructor(value100ms) {
    if (value100ms < 0) throw new Error('Time cannot be negative');
    this.value = value100ms;
  }
  format() { return formatTime100ms(this.value); }
}
```

### 10.4 Ubiquitous Language

The spec defines a clear vocabulary (Bout Event, Timeline, Cursor, Period Time, etc.), and the code mostly follows it — a positive sign. However, there are inconsistencies:

| Spec Term | Code Term | Consistent? |
|---|---|---|
| Scoresheet state | `appState.mode` | ✓ Yes |
| Bout event | Various regex matches | ⚠ No named type |
| Cursor | `appState.cursorIndex` | ✓ Yes |
| Correction buffer | `appState.correctionBuffer` | ✓ Yes |
| Event log | `appState.events` | ✓ Yes |
| Period time | `appState.periodTime100ms` | ✓ Yes |
| Bout time | `appState.boutTime100ms` | ✓ Yes |

![Proposed Domain Model](img/proposed-domain-model.png)

---

## 11. Code Structure and Organization

### 11.1 Function Length Distribution

| Range | Count | Examples |
|---|---|---|
| 1-10 lines | ~25 | `formatTime100ms`, `isCursorableEvent`, `hideContextMenu` |
| 11-30 lines | ~20 | `startTimer`, `moveCursor`, `modifyCurrentEvent` |
| 31-60 lines | ~10 | `updateBoutTimeDisplay`, `enterCorrectionMode`, `handleSwapModeKey` |
| 61-100 lines | ~5 | `handleCorrectionModeKey`, `initializeEventButtons` |
| 100+ lines | 4 | `getEffectiveBoutEvents` (~120), `getBoutEventsForTimelineRendering` (~135), `confirmTimeModChange` (~150), `generateExport` (~120) |

The four 100+ line functions are the primary refactoring candidates.

### 11.2 Naming Conventions

Generally good. Functions use clear verb-noun names (`recordEvent`, `updateTimeline`, `calculateScores`). Constants are uppercase (`INJURY_TIMER_LABELS`). Variables are camelCase.

Minor issues:
- `isCursorableEvent` uses an unusual adjective ("cursorable") — consider "isNavigableEvent"
- `getCursorableEvents` vs `getEffectiveBoutEvents` — both return filtered event arrays but naming doesn't convey the difference
- Several `const` declarations at module scope that are really singleton lookups: `const boutTimeDisplay = document.getElementById(...)` — these are evaluated once and work, but make it impossible to test without a DOM

### 11.3 Module Organization — ✅ RESOLVED (Refactor-03, Refactor-08, Refactor-09, Refactor-11)

Seven IIFE namespaces now provide encapsulation within the single-file constraint:
`Fmt`, `EventType`, `Score`, `Ruleset`, `Projection`, `ExportBuilder`, `CorrectionSM`.
All are exposed on `window.*` for tests.

---

## 12. Performance Considerations

### 12.1 Redundant `getEffectiveBoutEvents()` Calls — ✅ RESOLVED (Refactor-05)

A per-render-cycle `_projectionCache` object is keyed by a JSON snapshot of the state.
All calls within a single render cycle share the same result; the projection is recomputed at most once per state change.

### 12.2 `loadEmbeddedRuleset()` JSON Parsing — ✅ RESOLVED (Refactor-04)

`Ruleset.load()` caches the parse result in an IIFE-local `_cache` variable. The JSON is parsed once; subsequent calls return the cached object.

### 12.3 Full Timeline Re-render

`updateTimeline()` still rebuilds all DOM nodes from scratch. For the current scale (~100 events max per bout), the performance impact is negligible. A targeted DOM-diffing approach is deferred.

### 12.4 No Performance Concern at Current Scale

For the intended use case (bouts with typically 20-60 events), none of the remaining performance patterns cause user-visible problems. The improvements above were about code quality; further optimisation is out of scope.

---

## 13. Testability

### 13.1 Current Testing Approach

The application uses Playwright E2E tests exclusively. Tests interact with the app through:
- DOM click/type actions
- `window.testHelper` for state injection and inspection
- Pure namespace functions (`window.EventType`, `window.Score`, `window.Ruleset`, etc.) for direct unit-style assertions

### 13.2 Testability Improvements Delivered

1. **Pure namespaces extracted** (✅ Refactor-03, Refactor-04, Refactor-05, Refactor-08, Refactor-11, Refactor-13):
   `Fmt`, `EventType`, `Score`, `Ruleset`, `Projection`, `ExportBuilder`, `CorrectionSM` are all exposed on `window.*` and can be called directly in tests without DOM setup.

2. **Hidden timer hooks removed** (✅ Refactor-14):
   The `#start` / `#stop` hidden buttons and `testStartTimer` / `testStopTimer` functions have been removed. The timer is now controlled exclusively via the `Space` key and the `toggleTimer` helper in `helpers.js`.

3. **`dispatch()` exposed** (✅ Refactor-12):
   `window.testHelper.dispatch` allows tests to fire any bout command through the normal dispatch pipeline.

### 13.3 Remaining Considerations

- `testHelper.injectEvent()` still bypasses the dispatch pipeline (known, documented in `04-test-contract.md`)
- No unit test suite (Node.js) for pure namespace functions — deferred as out of scope

---

## 14. Recommendations Summary

### Priority 1 — All Completed ✅

| # | Recommendation | Status |
|---|---|---|
| 1 | Cache `loadEmbeddedRuleset()` result | ✅ Done (Refactor-04) |
| 2 | Cache `getEffectiveBoutEvents()` per render cycle | ✅ Done (Refactor-05) |
| 3 | Extract common event filtering into shared helper | ✅ Done (Refactor-07, Refactor-13) |
| 4 | Remove `formatInjuryTime()` (use `Fmt.mmss` instead) | ✅ Done (Refactor-02) |
| 5 | Extract event type constants/registry | ✅ Done (Refactor-13) |

### Priority 2 — All Completed ✅

| # | Recommendation | Status |
|---|---|---|
| 6 | Split `appState` into focused sub-objects | ✅ Done (Refactor-06, Refactor-14) |
| 7 | Split `confirmTimeModChange()` into context-specific functions | ✅ Done (Refactor-10) |
| 8 | Merge `getEffectiveBoutEvents()` and `getBoutEventsForTimelineRendering()` | ✅ Done (Refactor-07) |
| 9 | Introduce IIFE namespaces (Fmt, EventType, Score, Ruleset, etc.) | ✅ Done (Refactor-03, Refactor-04, Refactor-08, Refactor-11) |
| 10 | Formalize state machine for modes + sub-modes | ✅ Done (Refactor-09) |

### Priority 3 — Deferred

| # | Recommendation | Status |
|---|---|---|
| 11 | Introduce command/event separation pattern | ✅ Done via `dispatch()` (Refactor-12) |
| 12 | Extract pure domain functions for unit testing | ✅ Done via window namespaces (Refactor-03 through Refactor-13) |
| 13 | Add event type registry with OCP-compliant extension | ✅ Done (Refactor-13) |

---

## 15. Delivered Architecture

### 15.1 Domain Namespaces (Within Single File)

All recommendations from the original review have been implemented through Refactor-01 to Refactor-14.  The delivered design provides seven pure, testable namespaces within the single-file constraint:

| Namespace | Responsibility |
|---|---|
| `Fmt` | Time formatting (`time100ms`, `mmss`) |
| `EventType` | Event-type parsing, classification, color |
| `Score` | Score calculation and statistics |
| `Ruleset` | Ruleset loading (cached), validation, victory-type logic |
| `Projection` | Event log projection with optional rendering annotations; per-cycle cache |
| `ExportBuilder` | Pure export assembly from explicit context |
| `CorrectionSM` | Formal correction sub-mode state machine (`idle`/`cursor`/`insert`/`swap`) |

All are exposed on `window.*` for direct test access.

### 15.2 `appState` Domain Sub-objects

```javascript
appState.timers     // { running, intervalId, boutTime100ms, periodTime100ms, breakRunning, breakTime100ms }
appState.correction // { active, insertMode, swapMode, swapOriginIndex, cursorIndex, buffer, timeModTarget, timeModEvent }
appState.completion // { done, at, winner, victoryType, victoryDescription, classificationPoints, boutTime100ms }
```

Accessor helpers (`getTimers()`, `getCorrection()`, `getCompletion()`) provide concise read access.

### 15.3 Correction Flow

![Correction Flow](img/correction-flow.png)

### 15.4 Migration Phases — All Completed

| Phase | Description | Status |
|---|---|---|
| 1 | Extract pure functions into IIFE namespaces | ✅ Done |
| 2 | Cache ruleset and projection | ✅ Done |
| 3 | Split `appState` into domain sub-objects; remove compatibility shims | ✅ Done |
| 4 | Introduce `dispatch()` command pattern | ✅ Done |
| 5 | Extract domain layer for unit testing (window namespaces) | ✅ Done |

---

## Appendix: Diagram Sources

All PlantUML diagrams are stored in the `img/` subfolder:

- [current-architecture.puml](img/current-architecture.puml) — Component overview of the monolithic structure
- [state-machine.puml](img/state-machine.puml) — Application state transitions and sub-modes
- [event-flow.puml](img/event-flow.puml) — Event recording and rendering data flow
- [correction-flow.puml](img/correction-flow.puml) — Correction mode interaction sequence
- [proposed-domain-model.puml](img/proposed-domain-model.puml) — Proposed domain model class diagram
- [dependency-graph.puml](img/dependency-graph.puml) — Function dependency graph for critical paths

To generate PNG images from these diagrams:

```bash
# Requires Java and PlantUML JAR
java -jar plantuml.jar protocol/spec/img/*.puml
```

Alternatively, use the PlantUML VS Code extension or an online renderer (e.g., plantuml.com) to visualize these diagrams.
