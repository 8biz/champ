# Refactor 08: Introduce State Access Helpers and Split appState into Domains

## Goal
Start replacing the flat `appState` with focused sub-objects and access helpers without a risky big-bang rewrite.

## Why
The current state shape mixes unrelated concerns and allows illegal or confusing cross-domain mutations.

## Scope
- Introduce access helpers for state reads and writes.
- Split state ownership into domains such as bout, timers, correction, and completion.
- Preserve temporary compatibility where needed.

## Main files
- `protocol/protocol.html`
- `protocol/tests/helpers.js`
- `protocol/tests/correction-mode.spec.js`
- `protocol/tests/timer.spec.js`

## Tasks
1. Add accessor/helper functions for key state domains.
2. Move timer-related state into a timer-focused sub-object.
3. Move correction-related state into a correction-focused sub-object.
4. Move completion and bout metadata into focused sub-objects.
5. Keep compatibility paths for callers that cannot be migrated immediately.

## Acceptance criteria
- New code paths avoid direct flat `appState` mutation.
- State ownership is clearer by domain.
- Existing behavior and test contracts remain intact.

## Out of scope
- Full removal of compatibility shims.
- Command/event separation.

## Verification
- `npm test`
- Pay extra attention to timer, correction, and completion flows.
