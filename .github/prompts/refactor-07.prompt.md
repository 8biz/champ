# Refactor 07: Extract EventProjection and ExportBuilder with Targeted Tests

## Goal
Group the remaining high-value pure logic into explicit namespaces and add focused regression coverage around them.

## Why
Event projection and export assembly are central architectural seams and should be isolated before deeper state and command refactors.

## Scope
- Extract event-projection logic into a dedicated namespace.
- Extract export-assembly logic into a dedicated builder namespace.
- Add targeted browser-side tests for projection and export behavior.

## Main files
- `protocol/protocol.html`
- `protocol/tests/correction-export.spec.js`
- `protocol/tests/events.spec.js`
- `protocol/tests/helpers.js`

## Tasks
1. Extract the projection engine behind a dedicated namespace.
2. Extract export construction into a dedicated builder.
3. Add tests for projection parity across corrections and export output.
4. Keep existing app behavior and export schema intact.

## Acceptance criteria
- Projection and export code are easier to locate and reason about.
- Focused tests exist for projection and export parity.
- Export schema and behavior remain unchanged.

## Out of scope
- State-machine work.
- Dispatch migration.

## Verification
- `npm test`
- Validate export content against existing expectations.
