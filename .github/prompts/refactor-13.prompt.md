# Refactor 13: Build Central Event Registry and Consume It Across the App

## Goal
Replace scattered event-type knowledge with a shared registry used by parsing, scoring, rendering, correction utilities, and validation.

## Why
The same event-type rules are duplicated across many functions, making the code harder to extend and easier to break inconsistently.

## Scope
- Introduce a central event registry or metadata map.
- Update keyboard parsing, scoring, statistics, timeline rendering, and event-modification helpers to use it.
- Keep current event strings and behavior unchanged.

## Main files
- `protocol/protocol.html`
- `protocol/tests/events.spec.js`
- `protocol/tests/correction-mode.spec.js`
- `protocol/tests/activity-time.spec.js`

## Tasks
1. Define shared event metadata for points, passivity, cautions, timer events, and corrections.
2. Update parsing and rendering code to consume registry data.
3. Update score/statistics utilities to use the same source of truth.
4. Remove remaining one-off regex knowledge where practical.

## Acceptance criteria
- Event-type knowledge is centralized.
- Parsing, scoring, and rendering use the same metadata source.
- Existing user-visible behavior remains unchanged.

## Out of scope
- Introducing new user-facing event types.

## Verification
- `npm test`
- Focus on event recording, scoring, rendering, correction, and export flows.
