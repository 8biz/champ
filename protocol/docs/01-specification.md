# CHAMP Protocol — Specification (concise)

## Overview ✅
CHAMP Protocol is a single-file, offline-capable HTML5 tool to record wrestling bouts. It is optimized for quick keyboard entry, touch/mouse input, and produces a complete event-sourced JSON export for replay, analysis, and archival.

---

## Purpose & Users 🎯
- **Purpose:** Create a digital scoresheet that records all bout events (points, passivity, cautions, injury times, time control) and exports both presentation and authoritative event logs as JSON.
- **Primary users:** referees and match recorders. UI must be simple for non-technical users.

---

## High-level Workflow 🔁
1. **New scoresheet:** select ruleset and style, optionally fill header (match type, weight, age, wrestler info).
2. **Release scoresheet:** locks header and enables event recording.
3. **Record events:** start/stop bout time, award points, record passivity/cautions, start/stop injury time, make corrections.
4. **Complete bout:** when time or victory condition reached, enter victory type and classification points, export JSON.

> The header may be unlocked only after completion for editing corrections to the metadata.

---

## Keyboard & Input Specification ⌨️✨
General rules:
- Input is processed by a **sequence buffer** (array of keys). No timeout. Escape clears the buffer. Invalid keys are ignored and do not mutate the buffer. Keys are case-insensitive.
- Two modes: **Normal (recording at timeline end)** and **Correction (cursor on historical slot)**. Some keys (Space, Esc, Delete) are global.
- Visual feedback: show current buffer and temporary placeholder in the active slot.

Key sequences (examples):
- Space: start/stop bout time
- R + 1 | 2 | 4 | 5  => R1, R2, R4, R5 (Red points)
- B + 1 | 2 | 4 | 5 => B1, B2, B4, B5 (Blue points)
- R + P => RP (Red passivity); B + P => BP
- R + 0 + 1 => R0B1 (Red caution, Blue +1)
- R + 0 + 2 => R0B2 (Red caution, Blue +2)
- B + 0 + 1 => B0R1; B + 0 + 2 => B0R2
- R + + => R+ (start/stop injury without blood); R + * => R* (with blood). Same for B

Notes:
- '+' and '*' must be accepted from main keyboard and numpad. Digit keys accept main and numpad digits.
- Backspace acts as Left-Arrow only in Correction mode; otherwise ignored.
- After a complete sequence executes, the buffer is cleared.
- Invalid continuation keys are ignored (e.g., after R0, only '1' or '2' are accepted; other keys are ignored).

---

## Event Codes & Types 🔤
Use compact, self-explanatory codes for events and eventType enums.

Examples of event codes:
- R1, R2, R4, R5, B1, B2, B4, B5
- RP, BP (passivity)
- R0B1, R0B2, B0R1, B0R2 (cautions awarding opponent points)
- R+, R*, B+, B* (injury start/stop toggles)

Event types (for event log): OpenScoresheet, BoutTimeStarted, BoutTimeStopped, PointAwarded, PassivityRecorded, CautionRecorded, InjuryStarted, InjuryStopped, EventChanged, EventDeleted, ScoresheetCompleted, HeaderUpdated

---

## Timeline Model & Slot Structure 🕒
- Timeline is a list of slots in chronological order; slots grow as events are recorded.
- Each **Slot** (timeline item) contains at least:
  - `seq` (integer, monotonic)
  - `periodIndex` (integer, 0-based)
  - `boutTimeSeconds` (integer seconds since period start)
  - `eventCode` (string, e.g., "B2")
  - `periodScoreRed` / `periodScoreBlue` (integers showing cumulative score in the period after this event)
  - `isPeriodEnd` (boolean)
  - optional `note` or `meta`

UI behavior:
- After period end, show a strong divider; next slot starts with 0–0 for the new period.
- Cursor shows current input slot. Arrow keys move cursor for corrections.

---

## Event Sourcing & Export Format 📦
Export JSON contains two parts:
1. `scoresheet` — presentation data: ruleset, style, header, wrestlers, timeline (as shown), boutTime total, winner, classification, exportedAt, appVersion
2. `events` — authoritative event log in chronological order (every action recorded, including corrections).

Event record schema (minimum):
- `seq` (integer)
- `timestamp` (ISO 8601 UTC string)
- `eventType` (enum)
- `boutTimeSeconds` (integer, optional when relevant)
- `details` (object, type-specific payload)

Conventions:
- Timestamps in ISO 8601 UTC. UI may display M:SS but store seconds in events and timeline.
- Corrections must create an EventChanged/Deleted entry that references `originalSeq` in `details`.

Minimal export example (conceptual):
```
{
  "scoresheet": { ... },
  "events": [ {"seq":0, "timestamp":"2024-...Z","eventType":"OpenScoresheet"}, ... ]
}
```

---

## Ruleset Summary (validated structure) ⚙️
A ruleset JSON defines time and scoring parameters. Key fields:
- `name` (string), `periodsInSeconds` (array of integers), `boutTimeCountingDirection` ("Up" | "Down"), `breakSeconds`, `injuryTimeWithoutBloodSeconds`, `injuryTimeWithBloodSeconds`, `points` (array of allowed scoring increments), `maxPointDifferenceForVSU` (integer), `styles` (object), `victoryConditions` (array)

Example (valid JSON snippet):
```
{
  "name": "Active 2026",
  "periodsInSeconds": [180, 180],
  "boutTimeCountingDirection": "Down",
  "breakSeconds": 30,
  "injuryTimeWithoutBloodSeconds": 120,
  "injuryTimeWithBloodSeconds": 240,
  "points": [1,2,4],
  "maxPointDifferenceForVSU": 15
}
```

Recommendation: provide a JSON Schema (draft-07 or newer) and field defaults.

---

## Time & Timer Behavior ⏱️
- Store times as integers in seconds. Use ISO timestamps for absolute time.
- `boutTimeSeconds` is seconds relative to current period start (0..periodLength).
- Automatic actions: when period time expires, stop bout time and mark `isPeriodEnd`. If not final period, start break timer (optional, configured by ruleset).
- Optional feature: automatic detection of victory conditions (e.g., VSU by point difference) should be governed by ruleset options (autoDetect: true/false).

---

## Corrections & Audit 🔍
- All corrections are events. Keep original event entries immutable in the event log and add an `EventChanged` or `EventDeleted` entry referencing the original `seq`.
- Correction mode: cursor moves to slot, keyboard sequences update that slot (record an EventChanged). Enter confirms and moves cursor to timeline end. Esc cancels and returns the cursor to the end.

---

## Validation, Accessibility & Internationalization ♿🌍
- Validate rulesets and exports against JSON Schema.
- Accessibility: keyboard-first design, ARIA labels, high-contrast color variants and focus-visible styles.
- Internationalization: avoid hard-coded key labels in UI; support key remapping and local keyboard layouts (handle numpad and localized keys).

---

## Minimal Implementation Checklist (developer-oriented) ✅
- [ ] JSON Schemas for ruleset and export
- [ ] Keyboard FSM for sequence buffer + unit tests
- [ ] Event log (in-memory) + localStorage autosave + manual export
- [ ] UI: timeline, header form, event buttons, responsive layout for touch
- [ ] Accessibility and keyboard remapping UI
- [ ] Optional: auto-detect victory conditions toggle

---

## Recommendations / Next Steps 💡
1. Add the JSON Schema files: `ruleset.schema.json`, `export.schema.json` (I can generate these for you).
2. Implement the keyboard FSM and unit tests (I can provide FSM pseudocode or a TypeScript module).
3. Add small demo fixtures and Playwright tests for core flows (start/stop time, record points, caution, correction, export).

---

If you want, I can now: **A)** generate the JSON Schema files, or **B)** produce the keyboard FSM implementation (TypeScript + tests). Which do you prefer? 

