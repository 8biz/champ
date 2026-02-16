## CHAMP Protocol - JSON Export Format 📦


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
