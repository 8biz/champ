# Refactor 01: Stabilize Test Contract and Baseline

## Goal
Establish the current regression boundary and define the supported test-facing contract before any application refactor begins.

## Why
The current Playwright suite is tightly coupled to raw `appState`, hidden timer hooks, and ad hoc browser helpers. Refactoring the app safely requires a stable test contract first.

## Scope
- Run and record the current Playwright baseline.
- Inventory direct test dependencies on `window.testHelper`, `window.exportHelper`, hidden `#start` / `#stop`, DOM IDs, and raw keyboard sequences.
- Define the intended supported browser-side test contract.
- Document brittle areas and migration priorities.

## Main files
- `protocol/tests/helpers.js`
- `protocol/tests/**/*.spec.js`
- `protocol/protocol.html`
- `protocol/spec/01-specification.md`
- `protocol/spec/02-ui-specification.md`

## Tasks
1. Record current suite status and known brittle test seams.
2. List every direct test dependency on raw `window.testHelper.getState()` fields.
3. List timer tests that rely on hidden hooks.
4. Propose the minimal supported browser helper surface that tests should use during the refactor.
5. Add a short migration note to the relevant spec documents if needed.

## Acceptance criteria
- There is a written inventory of brittle test couplings.
- A supported test-helper contract is defined.
- The current suite status is recorded as the regression baseline.
- No production behavior changes are introduced.

## Out of scope
- Large application refactors.
- Removing any existing helper yet.

## Verification
- `npm test`
- Spot-check that no test behavior changed.
