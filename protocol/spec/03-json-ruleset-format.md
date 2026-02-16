# CHAMP Protocol — JSON Ruleset Format


## Recommendations / Next Steps 💡
1. Add the JSON Schema files: `ruleset.schema.json`, `export.schema.json` (I can generate these for you).
2. Implement the keyboard FSM and unit tests (I can provide FSM pseudocode or a TypeScript module).
3. Add small demo fixtures and Playwright tests for core flows (start/stop time, record points, caution, correction, export).


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
