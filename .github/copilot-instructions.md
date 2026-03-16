# Copilot Instructions — CHAMP

**CHAMP** is a single-file HTML5 app (`protocol/protocol.html`) for live recording of wrestling bouts. No backend, no build step, offline-first.

## Setup & Tests

```bash
npm install
npx playwright install   # downloads browser binaries; warnings are safe to ignore
npm test                 # runs all Playwright E2E tests
```

CI runs automatically on every push/PR via `.github/workflows/ci.yml`.

## Key Files

| Path | Purpose |
|---|---|
| `protocol/protocol.html` | **The entire app** — inline CSS + JS, single file, ~4 000 lines |
| `protocol/spec/` | Source of truth: overview, feature spec, UI spec |
| `protocol/tests/` | Playwright E2E tests (one file per feature area) |
| `protocol/rulesets/` | Embedded ruleset JSON files |
| `package.json` | Only defines the `test` script |

## Hard Constraints

- `protocol.html` **must stay a single file** — no bundler, no CDN links, no external dependencies.
- All CSS and JS is inlined; images use inline SVG or base64.
- Offline capability must never be broken.
- UI language is German; all user-visible strings must remain translatable.

## Development Rules

1. **Read specs first** — `protocol/spec/` defines requirements and UI constraints.
2. **Always run `npm test`** before and after your changes.
3. **Add or update tests** in `protocol/tests/` for every behavior change.
4. **Update specs** when changing defined behavior.
5. Use ES6+, Airbnb JS style (not enforced by tooling — apply manually).
6. No linters are configured; keep code consistent with the surrounding style.

## Design Quick-Reference

- Colors: Red `#d33131`, Blue `#1975d2`
- Viewport fits without scrolling; minimum 700×320 px (landscape) / 320×700 px (portrait)
- Semantic HTML, keyboard- and touch-friendly

## Pull Requests

Include a live preview link in every PR description:

```
https://raw.githack.com/8biz/champ/[branch]/protocol/protocol.html
```
