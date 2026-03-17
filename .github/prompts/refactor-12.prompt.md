# Refactor 12: Migrate Timer and Correction Flows to Command Dispatch

## Goal
Extend the dispatch architecture to timer control, period break, correction commit flows, and time modifications.

## Why
The biggest orchestration complexity remains in timer and correction flows, which still mix validation, side effects, and event emission.

## Scope
- Route bout timer, injury/blood timer, and period-break flows through dispatch.
- Route correction confirmation and correction-generated events through dispatch.
- Route time-modification event creation through dispatch where practical.

## Main files
- `protocol/protocol.html`
- `protocol/tests/timer.spec.js`
- `protocol/tests/period-break.spec.js`
- `protocol/tests/correction-mode.spec.js`
- `protocol/tests/correction-mode-time-modification.spec.js`

## Tasks
1. Add timer-related commands and handlers.
2. Add correction confirmation commands and handlers.
3. Route `_Modified` event creation through dispatch where appropriate.
4. Keep append-only event semantics and visible behavior unchanged.

## Acceptance criteria
- Timer and correction orchestration relies on dispatch rather than ad hoc direct flows.
- Existing correction and timer behavior remains intact.
- The event log remains append-only.

## Out of scope
- Final cleanup of all compatibility shims.

## Verification
- `npm test`
- Focus on timer, break, correction, and time-modification coverage.
