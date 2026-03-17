# Refactor 09: Formalize the Mode State Machine and Migrate Interaction Flows

## Goal
Replace the scattered mode and sub-mode booleans with an explicit state-machine helper and migrate interaction flows to it.

## Why
The current combination of `mode`, `inCorrectionMode`, `inInsertMode`, and `inSwapMode` allows fragile branching and illegal state combinations.

## Scope
- Introduce a state-machine helper for top-level mode and correction sub-mode.
- Migrate keyboard handling, correction flows, and context-menu behavior to use it.
- Preserve user-visible behavior while centralizing legal transitions.

## Main files
- `protocol/protocol.html`
- `protocol/tests/correction-mode.spec.js`
- `protocol/tests/context-menu.spec.js`
- `protocol/tests/completion-form-reset.spec.js`

## Tasks
1. Define a single modeled state representation.
2. Centralize legal mode transitions.
3. Migrate keyboard and context-menu logic to the new model.
4. Reduce direct boolean combination checks across the file.

## Acceptance criteria
- Interaction flows rely on a central mode model.
- Illegal sub-mode combinations are blocked by design or validation.
- Existing correction and completion behavior remains intact.

## Out of scope
- Full dispatch migration.
- Event registry expansion.

## Verification
- `npm test`
- Add focused checks for illegal-state prevention if missing.
