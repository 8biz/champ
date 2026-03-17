# Refactor 10: Split Time Modification into Dedicated Handlers

## Goal
Break the large `confirmTimeModChange()` flow into smaller named handlers with shared parsing and validation.

## Why
Time modification currently mixes multiple contexts and responsibilities in one large function, making it difficult to understand and refactor safely.

## Scope
- Separate parsing/validation from execution.
- Create dedicated handlers for live bout time, correction-mode bout time, completion-time editing, and injury/blood timers.
- Keep the modal UI behavior stable.

## Main files
- `protocol/protocol.html`
- `protocol/tests/time-modification.spec.js`
- `protocol/tests/time-modification-mouse.spec.js`
- `protocol/tests/correction-mode-time-modification.spec.js`
- `protocol/tests/injury-time-modification.spec.js`

## Tasks
1. Extract shared time-input parsing and validation.
2. Split each modification context into a dedicated handler.
3. Update modal wiring to call the new handlers.
4. Keep emitted events and visible behavior unchanged.

## Acceptance criteria
- `confirmTimeModChange()` is decomposed into smaller context-specific flows.
- Time-modification behavior remains unchanged for keyboard and mouse paths.
- Tests remain green.

## Out of scope
- Full command dispatch for all app actions.

## Verification
- `npm test`
- Focus on all time-modification and injury-time suites.
