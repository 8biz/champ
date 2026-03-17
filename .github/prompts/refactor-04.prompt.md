# Refactor 04: Cache Ruleset Loading and Extract Shared Event/Time Helpers

## Goal
Deliver the lowest-risk DRY and performance wins by removing repeated ruleset parsing and consolidating duplicated low-level helpers.

## Why
`loadEmbeddedRuleset()` reparses static JSON repeatedly, and event/time parsing logic is duplicated across many functions.

## Scope
- Cache embedded ruleset loading.
- Remove `formatInjuryTime()` in favor of shared formatting.
- Centralize event-type parsing helpers and shared constants.
- Extract shared raw bout-event filtering logic.

## Main files
- `protocol/protocol.html`
- `protocol/tests/activity-time.spec.js`
- `protocol/tests/injury-time.spec.js`
- `protocol/tests/ruleset.spec.js`

## Tasks
1. Make `loadEmbeddedRuleset()` return cached data after first parse.
2. Replace duplicate injury-time formatting with shared formatting helpers.
3. Add shared helpers for point/passivity/caution event parsing and side detection.
4. Extract shared raw-event filtering used by multiple event-processing paths.

## Acceptance criteria
- Embedded ruleset JSON is parsed once per page load.
- Duplicate time-formatting code is removed.
- Repeated low-level event regex logic is centralized.
- Existing behavior remains unchanged.

## Out of scope
- Merging the full event-processing pipelines.
- State-model refactoring.

## Verification
- `npm test`
- Focus on ruleset, injury-time, activity-time, and export-related flows.
