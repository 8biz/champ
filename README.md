# champ

[![CI](https://github.com/8biz/champ/actions/workflows/ci.yml/badge.svg)](https://github.com/8biz/champ/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://raw.githack.com/8biz/champ/main/protocol/protocol.html)

Competition office tools for live recording of wrestling bouts.

## Protocol

A single offline-capable HTML5 app that records all bout events (points, passivity, cautions, time stoppages) with timestamps and exports a structured JSON scoresheet.

👉 **[Try it live](https://raw.githack.com/8biz/champ/main/protocol/protocol.html)**

## Quick Start

```bash
git clone https://github.com/8biz/champ.git
cd champ
npm install
npx playwright install   # one-time setup for browser tests
npm test
```

Open `protocol/protocol.html` directly in any modern browser — no server needed.

## Docs

- [Spec overview](protocol/spec/00-overview.md) — features, workflow, terminology
- [Feature spec](protocol/spec/01-specification.md)
- [UI spec](protocol/spec/02-ui-specification.md)
- [Contributing](CONTRIBUTING.md)

