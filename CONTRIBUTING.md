# Contributing

Thank you for contributing to CHAMP — tools for the competition office. This file explains how to get the repository running locally, coding and testing expectations, and how to propose changes.

Getting started
- Clone the repository and install dev dependencies:

```bash
git clone <repo-url>
cd champ
npm install
```

- Install Playwright browsers (required for tests):

```bash
npx playwright install
```

Running tests
- Run the Playwright test suite:

```bash
npm test
# Or directly:
npx playwright test
```

Coding standards
- Frontend: HTML, CSS, JavaScript. Keep changes small and browser-friendly.
- JavaScript style: follow an established style (Airbnb recommended).
- Backend tools (if added): Python is preferred; follow PEP 8.
- Add unit or integration tests for any behavior you change.

Branching & pull requests
- Work on feature branches named `feature/short-desc` or `fix/short-desc`.
- Open a pull request against `main` with a clear title and description.
- Include a short summary of changes, motivation, and any manual test steps.

Tests and CI
- The repository uses Playwright for browser tests. Run `npx playwright install` when adding tests.
- If you add or change automated checks, update `package.json` and document the commands here.

Reporting issues
- Open an issue for bugs, feature requests, or spec changes. Provide reproduction steps and expected behavior.

Thanks for helping improve CHAMP.
