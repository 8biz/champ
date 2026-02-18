# AGENTS

Purpose
- Provide instructions and guidance for AI agents working in this repository.

Quick CLI (implemented)
- Install Node dependencies: `npm install`
- Install Playwright browsers: `npx playwright install`
- Run tests: `npm test` (runs `npx playwright test`) or `npx playwright test`

How to run the demo
- Open [protocol/protocol.html](protocol/protocol.html) in a browser.
- Public preview: https://raw.githack.com/8biz/champ/main/protocol/protocol.html

Repository layout (important locations)
- [spec](spec) — project-wide specifications and glossary.
- [protocol](protocol) — frontend protocol tool and its tests.
- [protocol/protocol.html](protocol/protocol.html) — single-file web app demo.
- [protocol/tests](protocol/tests) — Playwright tests for the protocol tool.
- [package.json](package.json) — repository scripts and devDependencies.

Coding & contribution notes
- Frontend: HTML, CSS, JavaScript. Keep changes small and browser-friendly.
- Backend: Python is the preferred language for any backend tools.
- Tests: Use Playwright for end-to-end testing. Always run `npx playwright install` after adding browser tests.
- Style: Follow PEP8 for Python and a consistent JS style (Airbnb rules encouraged).

Agent guidance (how AI agents should operate)
- Run `npm install` and `npx playwright install` before running tests.
- Run `npm test` after changes that affect the UI or tests.
- Prefer minimal, focused edits; update specs in `spec/` when changing behavior.
- Add or update tests in `protocol/tests` for any protocol UI changes.
- If adding new CLI scripts, update `package.json` and this `AGENTS.md`.

Contact / next steps
- If you want me to add script badges, CI steps, or a CONTRIBUTING guide, tell me which part to implement next.
