# Refactor 11: Introduce Command Dispatch and Migrate Normal Recording

## Goal
Create the first command-to-event dispatch path and migrate normal recording flows onto it.

## Why
User actions currently call event recording and side effects directly, which mixes validation, state updates, rendering, and event emission.

## Scope
- Add a central dispatch skeleton.
- Route normal keyboard and button-driven bout-event recording through it.
- Invalidate caches and trigger rendering centrally.

## Main files
- `protocol/protocol.html`
- `protocol/tests/events.spec.js`
- `protocol/tests/next-event-buffer.spec.js`
- `protocol/tests/space-partial-buffer.spec.js`

## Tasks
1. Define a dispatch entry point for commands.
2. Add validation and event emission for normal recording commands.
3. Migrate keyboard and button recording to use dispatch.
4. Keep user-visible behavior and event log semantics unchanged.

## Acceptance criteria
- Normal recording flows use the dispatch path.
- Side-effect orchestration is more centralized.
- Existing keyboard-buffer behavior remains unchanged.

## Out of scope
- Migrating every timer and correction flow.

## Verification
- `npm test`
- Focus on event recording, buffer handling, and next-event display.
