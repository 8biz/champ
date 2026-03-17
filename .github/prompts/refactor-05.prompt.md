# Refactor 05: Unify Effective Event Processing and Add Projection Caching

## Goal
Create one shared event-projection path for effective bout events and timeline rendering, backed by memoization.

## Why
The app recomputes effective events multiple times per action and maintains two highly similar event-processing implementations.

## Scope
- Add render-cycle caching for effective event projection.
- Merge `getEffectiveBoutEvents()` and `getBoutEventsForTimelineRendering()` behind one shared processor with options.
- Preserve current callers with compatibility wrappers during migration.

## Main files
- `protocol/protocol.html`
- `protocol/tests/correction-mode.spec.js`
- `protocol/tests/correction-export.spec.js`
- `protocol/tests/events.spec.js`

## Tasks
1. Add a projection cache keyed by raw event log state and pending correction state.
2. Implement a single processor that can optionally annotate events for rendering.
3. Route score, timeline, completion auto-fill, and export logic through the shared projection.
4. Remove duplicated projection logic once parity is proven.

## Acceptance criteria
- Effective-event computation is reused rather than recomputed repeatedly.
- Timeline rendering and non-render callers share one underlying projection engine.
- Correction previews and export output remain behaviorally identical.

## Out of scope
- Command dispatch.
- Full state-model changes.

## Verification
- `npm test`
- Compare seeded scenarios for scores, timeline, corrections, and export parity.
