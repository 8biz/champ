# Contributing

## Setup

```bash
git clone https://github.com/8biz/champ.git
cd champ
npm install
npx playwright install   # downloads browser binaries for tests
```

## Run Tests

```bash
npm test
```

CI runs the same suite on every push and PR.

## Making Changes

1. **Read the specs** in `protocol/spec/` before touching any code.
2. Work on a branch: `feature/short-desc` or `fix/short-desc`.
3. Edit `protocol/protocol.html` directly — it is the entire app (single file, no build step).
4. Add or update tests in `protocol/tests/` for every behavior change.
5. Run `npm test` — all tests must pass.
6. Open a PR against `main` with a clear title and a live preview link:
   ```
   https://raw.githack.com/8biz/champ/[branch]/protocol/protocol.html
   ```

## Code Style

- HTML/CSS/JavaScript: ES6+, Airbnb JS style (not enforced by tooling — apply manually).
- Keep `protocol.html` as a single file; no external dependencies or CDN links.

## Reporting Issues

Open a GitHub issue with reproduction steps and expected vs. actual behavior.

