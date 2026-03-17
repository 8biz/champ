# Refactor 06: Extract Pure Namespaces for Formatters, Event Types, Rulesets, and Scoring

## Goal
Create explicit pure namespaces inside the single-file app for the most stable domain logic.

## Why
Pure logic is currently scattered across the file, making it hard to reason about, reuse, and test independently.

## Scope
- Extract IIFE-style namespaces for formatters, event metadata/parsing, ruleset logic, and score/statistics calculation.
- Keep production code in a single HTML file.
- Preserve behavior and public app semantics.

## Main files
- `protocol/protocol.html`
- `protocol/tests/*.spec.js`

## Tasks
1. Extract a formatting namespace for time and display helpers.
2. Extract an event-type namespace for shared metadata and parsing.
3. Extract a ruleset namespace for validation and victory-condition logic.
4. Extract a score namespace for score/statistics calculation.
5. Update call sites to use the new namespaces.

## Acceptance criteria
- Pure helpers are grouped logically in namespaces.
- No build step or extra production files are introduced.
- Behavior remains unchanged.

## Out of scope
- Dispatch architecture.
- Deep state restructuring.

## Verification
- `npm test`
- Spot-check score, ruleset, and formatting behavior.
