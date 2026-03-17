# Refactor 03: Align Specs with Keyboard and Test Contracts

## Goal
Make the supported keyboard behavior and test-facing contract explicit in the specs so refactoring has a documented boundary.

## Why
The code and tests currently imply contracts that are not fully specified, especially around keyboard sequences and hidden test hooks.

## Scope
- Update keyboard-sequence expectations in the functional spec.
- Remove or revise hidden test-hook references in the UI spec.
- Document any supported browser helper behavior that is intentionally retained during refactoring.

## Main files
- `protocol/spec/01-specification.md`
- `protocol/spec/02-ui-specification.md`
- `protocol/tests/helpers.js`
- `protocol/protocol.html`

## Tasks
1. Document the keyboard sequence contract used for event recording and correction flows.
2. Update UI-spec references to hidden test controls if they are no longer part of the intended contract.
3. Clarify what browser-side helper behavior is considered supported for tests.

## Acceptance criteria
- The specs reflect the intended keyboard and testing contract.
- Hidden timer hooks are no longer treated as a required UI element unless deliberately retained.
- Spec changes match current behavior or explicitly describe the intended migration.

## Out of scope
- Large code changes unrelated to spec alignment.

## Verification
- Review changed specs against current tests and behavior.
