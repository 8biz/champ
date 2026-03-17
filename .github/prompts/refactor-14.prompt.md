# Refactor 14: Remove Shims, Finalize Test Surface, and Close Documentation

## Goal
Complete the refactor by removing temporary compatibility paths, minimizing the final test surface, and aligning documentation with the delivered architecture.

## Why
Incremental refactoring will leave temporary wrappers and compatibility code that should not become permanent architecture.

## Scope
- Remove temporary compatibility wrappers and dead paths.
- Minimize the final `window.testHelper` contract.
- Remove hidden timer test hooks if still present.
- Update specs and architecture review to reflect the final design.

## Main files
- `protocol/protocol.html`
- `protocol/spec/01-specification.md`
- `protocol/spec/02-ui-specification.md`
- `protocol/spec/03-architecture-design-review.md`
- `protocol/tests/helpers.js`

## Tasks
1. Remove duplicated projection wrappers and legacy state fallbacks.
2. Tighten the browser-side test helper to the minimum supported contract.
3. Remove hidden timer hooks if no longer needed.
4. Update specs and architecture documentation to match the code.
5. Ensure every recommendation from the review is closed or explicitly deferred.

## Acceptance criteria
- Temporary migration shims are removed.
- The final test surface is narrow and intentional.
- Documentation matches the delivered architecture.
- The full suite is green.

## Out of scope
- New feature development unrelated to the refactor.

## Verification
- `npm test`
- Manual smoke pass across release, record, correct, complete, re-release, and export.
