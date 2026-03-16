# AGENTS

AI agent quick-reference for the CHAMP repository.

## Setup

```bash
npm install
npx playwright install   # browser binaries; warnings are safe to ignore
```

## Test

```bash
npm test   # runs all Playwright E2E tests via CI-equivalent pipeline
```

CI runs on every push/PR via `.github/workflows/ci.yml`.

## Repository Layout

```
protocol/
  protocol.html      # the entire app — single HTML file, ~4 000 lines, inline CSS+JS
  spec/              # source of truth: 00-overview, 01-specification, 02-ui-specification
  tests/             # Playwright E2E tests (one file per feature area)
  rulesets/          # embedded ruleset JSON files
package.json         # defines only the `test` script
```

## Key Rules

- `protocol.html` must stay **one file** — no build step, no CDN links, no external deps.
- Read `protocol/spec/` **before** making changes.
- Run `npm test` **before and after** every change.
- Add or update tests in `protocol/tests/` for every behavior change.
- Update specs when changing defined behavior.

## Pull Requests

Always include a live preview link in the PR description:

```
https://raw.githack.com/8biz/champ/[branch]/protocol/protocol.html
```
