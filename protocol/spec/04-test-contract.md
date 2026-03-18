# CHAMP Protocol — Test Contract

This document defines the stable, supported browser-side interface that Playwright tests may use,
and records a full inventory of the brittle test couplings that exist in the current suite.
It was created as part of **Refactor-01** to establish a regression baseline before any
application-level refactoring begins.

---

## 1. Regression Baseline

| Date | Suite | Result |
|------|-------|--------|
| 2026-03-17 | 396 Playwright tests (`npm test`) | **396 passed, 0 failed** |
| 2026-03-18 | 470 Playwright tests (`npm test`) | **470 passed, 0 failed** |

Re-run `npm test` to verify the baseline at any time.

---

## 2. Supported Test-Helper Contract

The following browser-side helpers are the **officially supported** interface for tests.
Their shape must be preserved across application refactors.

### 2.1 `window.testHelper`

Exposed unconditionally at application start (see `protocol.html`).

#### Read — `getState() → object`

Returns a shallow snapshot of application state.  
**Guaranteed fields:**

| Field | Type | Description |
|-------|------|-------------|
| `mode` | `string` | App mode: `'New'` \| `'Recording'` \| `'Completing'` \| `'Completed'` \| `'Re-released'` |
| `inCorrectionMode` | `boolean` | Correction mode is active |
| `inInsertMode` | `boolean` | Insert sub-mode is active within correction mode |
| `inSwapMode` | `boolean` | Swap sub-mode is active within correction mode |
| `cursorIndex` | `integer` | Zero-based cursor position in the timeline |
| `correctionBuffer` | `array` | Shallow copy of current correction buffer entries |
| `timerRunning` | `boolean` | Period timer is counting down |
| `breakTimerRunning` | `boolean` | Period-break countdown is running |
| `breakTime100ms` | `integer` | Remaining break time in 100 ms units |
| `currentPeriodIndex` | `integer` | Zero-based index of the active period |
| `periodTime100ms` | `integer` | Remaining period time in 100 ms units |
| `boutTime100ms` | `integer` | Cumulative bout time elapsed in 100 ms units |
| `injuryTimers` | `object` | Timer state keyed by `IR`, `IB`, `BR`, `BB` (each: `{ running: boolean, time100ms: integer }`) |
| `activityTimers` | `object` | Timer state keyed by `AR`, `AB` (each: `{ active: boolean, time100ms: integer, seq: any }`) |

#### Write — mutation helpers (test-setup only)

| Method | Signature | Effect |
|--------|-----------|--------|
| `injectEvent` | `(evt: object) → void` | Pushes a synthetic event into the event log and refreshes the timeline |
| `setPeriodTime100ms` | `(value: integer) → void` | Overrides the remaining period time and updates the display |
| `setBoutTime100ms` | `(value: integer) → void` | Overrides the cumulative bout time |
| `setInjuryTime100ms` | `(key: string, value: integer) → void` | Overrides the stored time for the named injury timer and updates its display |
| `setActivityTime100ms` | `(key: string, value: integer) → void` | Overrides the stored time for the named activity timer and updates its display |
| `triggerPeriodBreak` | `(breakSeconds?: integer) → void` | Records a `PeriodEnd` event, advances the period index, and starts the break countdown |

### 2.2 `window.exportHelper`

| Method | Signature | Returns |
|--------|-----------|---------|
| `generate` | `() → object` | Full export object (see export format in `01-specification.md`) |
| `download` | `() → void` | Triggers a browser file download of the export JSON |

### 2.3 `window.rulesetHelper`

| Method | Description |
|--------|-------------|
| `load()` | Returns the currently loaded embedded ruleset object |
| `validate(ruleset)` | Validates a ruleset object; returns `{ valid: boolean, errors: string[] }` |
| `resolveClassificationPoints(ps, context)` | Resolves classification points given a point-structure and bout context |
| `evaluateCondition(condition, context)` | Evaluates a single ruleset condition |
| `findMatchingVictoryTypes(context, ruleset)` | Returns matching victory type entries for a context |
| `getBoutContext(options)` | Builds a bout context object |
| `getLastAwardSide(events)` | Returns the last side (`'red'`/`'blue'`) that was awarded points |
| `findTiebreakWinner(events, ruleset)` | Returns the tiebreak winner, or `null` if undecided |

### 2.4 Hidden DOM timer hooks

Two invisible buttons provide a programmatic timer control that bypasses focus/keyboard state.

| Element ID | Action |
|------------|--------|
| `#start` | Starts the period timer (equivalent to Space when timer is stopped) |
| `#stop` | Stops the period timer (equivalent to Space when timer is running) |

---

## 3. Brittle Test Couplings Inventory

### 3.1 Direct `window.testHelper.getState()` field access

Used in 14 test files.  The fields map one-to-one onto internal `appState` property names.
Any renaming of `appState` fields will silently break all assertions below.

| Field path | Used by test file(s) |
|------------|----------------------|
| `mode` | — (currently unused directly; covered by DOM state) |
| `inCorrectionMode` | `event-swap`, `correction-mode`, `correction-mode-time-modification`, `context-menu` |
| `inInsertMode` | `event-swap` |
| `inSwapMode` | `event-swap` |
| `cursorIndex` | `event-swap`, `correction-mode`, `context-menu` |
| `correctionBuffer` | `event-swap`, `correction-mode` |
| `timerRunning` | `injury-time` |
| `breakTimerRunning` | `period-break` |
| `currentPeriodIndex` | `period-break` |
| `periodTime100ms` | — (set but currently not asserted via getState) |
| `boutTime100ms` | `time-modification` |
| `injuryTimers.IR.running` | `injury-time`, `injury-time-modification` |
| `injuryTimers.IR.time100ms` | `injury-time`, `injury-time-modification` |
| `injuryTimers.IB.running` | `injury-time` |
| `injuryTimers.BR.running` | `injury-time` |
| `injuryTimers.BB.running` | `injury-time` |
| `activityTimers.AR.active` | `activity-time` |
| `activityTimers.AR.time100ms` | `activity-time` |
| `activityTimers.AB.active` | `activity-time` |

### 3.2 `window.testHelper` mutation hooks

All mutation helpers write directly into `appState` without going through the normal input
pipeline.  They exist to avoid slow real-time simulation.

| Method | Used by test file(s) | Risk |
|--------|----------------------|------|
| `injectEvent` | `events`, `period-break` | Bypasses sequence-number and validation logic |
| `setPeriodTime100ms` | `activity-time`, `period-break` | Bypasses timer-tick side-effects |
| `setBoutTime100ms` | `period-break`, `time-modification` | Bypasses timer-tick side-effects |
| `setInjuryTime100ms` | `injury-time`, `injury-time-modification` | Bypasses display-update chain for the full timer |
| `setActivityTime100ms` | `activity-time` | Bypasses display-update chain for the full timer |
| `triggerPeriodBreak` | `period-break`, `time-modification` | Calls internal `startPeriodBreak()` directly |

### 3.3 Hidden DOM timer hooks (`#start` / `#stop`)

**Status (Refactor-14): removed.**

The `#start` and `#stop` hidden buttons and the `testStartTimer` / `testStopTimer` functions have been deleted from the application. The timer is now controlled exclusively via the `Space` key and the `toggleTimer` helper in `helpers.js`.

| Element | Former seam | Status |
|---------|-------------|--------|
| `#start` | Called `startTimer()` directly | **Removed (Refactor-14)** |
| `#stop` | Called `stopTimer()` directly | **Removed (Refactor-14)** |

### 3.4 Direct `window.appState` access

**Status (Refactor-03): dead code — removed.**

The `page.evaluate(() => window.appState ? window.appState.events : [])` call on
`correction-mode.spec.js:830` stored event-log data in a local variable that was never used
in an assertion; the actual check was already performed via the DOM locator on the following
lines.  The dead `evaluate` call has been deleted; the test still passes and the verified
behaviour is unchanged.

### 3.5 `window.exportHelper` usage

Used in 10 test files via `window.exportHelper.generate()`.  
This is a stable, documented API (see `01-specification.md`), but the *shape* of the returned
object (field names, nesting) is implicitly treated as a contract in every assertion against it.

### 3.6 `window.rulesetHelper` usage

Used in `ruleset.spec.js` only.  
Accesses `load()`, `validate()`, and `resolveClassificationPoints()`.  These are stable API
functions; the risk is low unless the ruleset schema changes.

---

## 4. Migration Priorities

| Priority | Item | Recommended action |
|----------|------|--------------------|
| ✅ DONE | `window.appState` direct access in `correction-mode.spec.js:830` | Dead code removed (Refactor-03) |
| ✅ DONE | `#start` / `#stop` hidden DOM hooks | Removed from HTML and JS (Refactor-14) |
| ✅ DONE | `Object.defineProperties` compatibility shims on `appState` | Removed; all code uses domain sub-objects directly (Refactor-14) |
| 🟠 MEDIUM | `window.testHelper.injectEvent()` and `triggerPeriodBreak()` bypass business logic | Document clearly that these are low-level shortcuts; add usage guard comments |
| 🟡 LOW | Export object shape used as implicit contract | Add explicit schema tests to `ruleset.spec.js` / `uc001.spec.js` |

---

## 5. Out of Scope

- Removing any existing helper.
- Changes to production behavior.
- Application architecture refactoring.

These will follow in subsequent refactoring steps, guided by the contract defined here.
