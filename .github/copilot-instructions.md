# Copilot Instructions for CHAMP Repository

## Repository Overview

**CHAMP** (Competition office tools) is a lightweight web application for live recording of wrestling matches. The primary tool is a single-file HTML5 application (`protocol.html`) that works offline and allows recording all bout events with timestamps, scores, and event logs for later export to JSON.

**Project Type:** Single-page web application (frontend only, no backend)  
**Size:** Small (~14 files, ~112KB excluding dependencies)  
**Languages:** HTML, CSS, JavaScript (ES6+)  
**Target Runtime:** Modern web browsers (desktop and mobile)  
**Testing:** Playwright for end-to-end browser tests

## Quick Start & Build Instructions

### Initial Setup (Required)
ALWAYS run these commands in order when starting work:

```bash
npm install
npx playwright install
```

**Important:** `npx playwright install` downloads browser binaries (~400MB). This takes 2-3 minutes and may show warnings about missing system dependencies—these warnings can be safely ignored as the browsers will still work for testing.

### Running Tests
```bash
npm test
# OR
npx playwright test
```

**Expected output:** `1 passed` in ~3-4 seconds. Tests use local file:// protocol to load protocol.html.

### Common Issues & Workarounds
- **Issue:** Tests fail with "Cannot find protocol.html"  
  **Fix:** Tests run from repo root. Ensure you're in `/home/runner/work/champ/champ` directory.
  
- **Issue:** Playwright not installed  
  **Fix:** Run `npx playwright install` (not `npm install playwright`).

- **Issue:** Missing browser dependencies warning  
  **Fix:** Safe to ignore. Browsers are downloaded to `~/.cache/ms-playwright/` and work despite warnings.

## Project Layout & Architecture

### Directory Structure
```
/
├── protocol/              # Main protocol tool
│   ├── protocol.html     # Single-file web app (74 lines, standalone)
│   ├── spec/             # Project specifications
│   │   ├── 00-overview.md        # High-level overview & terminology
│   │   ├── 01-specification.md   # Feature specifications
│   │   └── 02-ui-specification.md # UI design & guidelines
│   └── tests/
│       └── timer.spec.js  # Playwright E2E tests
├── .devcontainer/
│   └── devcontainer.json  # VS Code Dev Container config (Node 18)
├── package.json           # Scripts: test command only
├── README.md              # Project documentation
├── CONTRIBUTING.md        # Contribution guidelines
├── AGENTS.md              # AI agent guidance (existing)
└── .gitignore            # Excludes: node_modules, test-results, __brainstorming
```

### Key Files & Their Purpose

**protocol/protocol.html** (74 lines)
- Standalone countdown timer demo (currently incomplete)
- Target: Full wrestling bout recording tool
- No build step—edit directly and open in browser
- Must remain a single HTML file with inline CSS/JS

**protocol/spec/** (Read before making changes)
- `00-overview.md`: Wrestling match recording requirements, terminology, user workflow
- `01-specification.md`: Event types, data structures, ruleset details
- `02-ui-specification.md`: UI constraints, timeline design, color scheme (#d33131 red, #1975d2 blue)

**protocol/tests/timer.spec.js**
- Tests countdown timer: starts at 3:00, counts down, stop button works
- Uses `file://` protocol to load local HTML

### Configuration Files
- **package.json**: Only defines `test` script. No build, lint, or bundle scripts exist.
- **devcontainer.json**: Auto-runs `npm install && npx playwright install --with-deps` on container creation.
- **No linting configs**: No ESLint, Prettier, or other code quality tools configured.

## Validation & Quality Checks

### Before Committing Changes

1. **Run tests:**
   ```bash
   npm test
   ```
   Must pass. If timer.spec.js fails, you likely broke the countdown timer in protocol.html.

2. **Manual browser test:**
   Open `protocol/protocol.html` in a browser (Chrome/Firefox/Safari):
   - Timer displays "3:00" on load
   - Start button begins countdown
   - Stop button freezes timer

3. **Check file structure:**
   - protocol.html must remain a single file
   - No generated files should be committed (node_modules, test-results already gitignored)

### No CI/CD Pipeline
- **No GitHub Actions workflows exist** (`.github/workflows/` directory doesn't exist)
- All validation is manual via `npm test`
- Consider this when adding features: you are responsible for running tests

## Development Guidelines

### Coding Standards
- **HTML/CSS/JavaScript:** Keep protocol.html browser-friendly. Use ES6+ but avoid bleeding-edge features.
- **Style guide:** Follow Airbnb JavaScript style guide (aspirational—not enforced by tooling).
- **Comments:** Match existing style. Currently minimal commenting; only add if clarifying complex logic.
- **Backend tools (future):** Python preferred, follow PEP 8.

### Testing Strategy
- **Add tests for new UI features** in `protocol/tests/`
- Follow existing pattern: use `page.goto("file://" + process.cwd() + "/protocol/protocol.html")`
- Use Playwright locators: `page.locator("#element-id")`
- Test timing-dependent features with `page.waitForTimeout()` (used in timer test)

### Making Changes
1. **Read specs first:** `protocol/spec/` documents requirements and constraints
2. **Keep changes minimal:** Single HTML file constraint means every change is visible
3. **Update specs if changing behavior:** Specs in `spec/` are source of truth
4. **Test immediately after changes:** `npm test` catches regressions quickly

### Live Demo
Protocol.html is publicly accessible at:  
https://raw.githack.com/8biz/champ/main/protocol/protocol.html

Changes merged to `main` branch are immediately visible here.

## What NOT to Do

- ❌ Do not create build systems or bundlers (must stay single HTML file)
- ❌ Do not install linters without discussion (none currently configured)
- ❌ Do not add external dependencies (inline everything)
- ❌ Do not commit node_modules, test-results, or __brainstorming directory
- ❌ Do not break offline capability (no CDN links)
- ❌ Do not add GitHub Actions without coordinating (no workflows exist yet)

## Additional Context

### Target Users
- Wrestling officials/scorekeepers recording live bouts
- Not tech-savvy; UI must be intuitive
- Need speed and accuracy during competitions

### Internationalization
- Current UI language: German
- Must support easy translation (English minimum)
- Keyboard shortcuts should work across keyboard layouts

### Design Constraints (from specs)
- All UI must fit in viewport without scrolling
- Minimum viewport: 700×320px (landscape) or 320×700px (portrait)
- Color scheme: Red (#d33131), Blue (#1975d2), neutral grays
- Use semantic HTML for accessibility

### Event Recording Workflow (from specs)
1. Prepare scoresheet (wrestler names, match info)
2. Release for recording (locks info fields)
3. Record events during bout (points, passivity, cautions, time events)
4. Complete bout (enter victory type, export JSON)

## Pull Requests

- When creating a pull request, include a preview link to the branch-hosted single-file app in the PR description.
- Use this preview link template (replace [source_branch] with your branch name):
  `https://raw.githack.com/8biz/champ/[source_branch]/protocol/protocol.html`
- Example: `https://raw.githack.com/8biz/champ/feature/timer-fix/protocol/protocol.html`
- Run `npm test` before opening the PR and mention any relevant test or UI changes in the PR summary.

## Trust These Instructions

The commands and information in this file have been validated by running them in a clean environment. If you encounter issues not documented here, investigate and update this file with your findings. Only search the codebase if these instructions are incomplete or incorrect.
