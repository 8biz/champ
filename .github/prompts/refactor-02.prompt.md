# Refactor 02: Migrate Playwright Tests to Semantic Helpers

## Goal
Replace direct test coupling to raw state and hidden hooks with intent-based helper APIs in the Playwright layer.

## Why
Tests currently block internal refactoring because they assume the exact `appState` shape and implementation details.

## Scope
- Extend `protocol/tests/helpers.js` with semantic helper functions.
- Refactor the most brittle suites first: correction mode, correction time modification, context menu, timer, injury time, activity time, and export-related flows.
- Remove direct test reliance on hidden timer controls where possible.

## Main files
- `protocol/tests/helpers.js`
- `protocol/tests/correction-mode.spec.js`
- `protocol/tests/correction-mode-time-modification.spec.js`
- `protocol/tests/context-menu.spec.js`
- `protocol/tests/timer.spec.js`
- `protocol/tests/injury-time.spec.js`
- `protocol/tests/activity-time.spec.js`
- `protocol/tests/correction-export.spec.js`

## Tasks
1. Add semantic helpers for correction snapshots, timer control, export access, and timeline queries.
2. Migrate the named suites to the helper layer.
3. Reduce direct `page.evaluate(() => window.testHelper.getState())` usage.
4. Keep behavior unchanged while improving test resilience.

## Acceptance criteria
- Target suites use semantic helpers instead of raw state shape for common flows.
- Timer tests do not depend on hidden DOM hooks for their primary happy paths.
- The refactored suites remain green.

## Out of scope
- Changing application architecture.
- Deleting the browser-side compatibility layer entirely.

## Verification
- `npm test`
- Confirm helper APIs are reused across multiple suites.
