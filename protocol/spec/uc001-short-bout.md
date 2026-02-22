# Use Case 001 - Short bout

Summary: User releases the scoresheet, records a short bout, completes it, and stores the JSON export.

## Preconditions

User has opened a new scoresheet in state "Idle" as defined in `02-ui-specification.md`.

## Postconditions

- Expected JSON export (timestamps omitted):
    - the timestamps in "events" must be ascending
    - the events in "timeline" must match the corresponding events in "events"
    - the "totalBoutTime100ms" in "summary" must be the sum of all running timer phases (between "T_Started" and "T_Stopped")
    - the "scores" in "summary" must reflect the technical points from the events
    - the "winner" in "summary" must be the wrestler with more technical points
    - the "victory" type in "summary" must be based on the last event (in this case, "4R") and the winner
    - the "classificationPoints" in "victory" must be based on the victory type and winner according to the ruleset

```json
{
    "bout": {
        "header": {
            "info": "",
            "style": "Freestyle",
            "ruleset": {
                "reference": "de-mannschaftskampf-2025"
            },
            "wrestlers": {
                "red": { "info": "Rot" },
                "blue": { "info": "Blau" }
            }
        },
        "summary": {
            "completed": true,
            "duration": {
                "totalBoutTime100ms": "<sum of both running timer phases>"
            },
            "scores": {
                "red": 4,
                "blue": 1
            },
            "winner": "red",
            "victory": {
                "type": "SS",
                "description": "Schultersieg",
                "classificationPoints": [4, 0]
            },
            "statistics": {
                "red": {
                    "technicalPoints": { "1": 0, "2": 0, "4": 1, "5": 0 },
                    "passivity": 0,
                    "cautions": 0
                },
                "blue": {
                    "technicalPoints": { "1": 1, "2": 0, "4": 0, "5": 0 },
                    "passivity": 0,
                    "cautions": 0
                },
                "totalEvents": 8,
                "corrections": 0
            },
            "timeline": [
                { "seq": 3, "eventType": "1B", "boutTime100ms": "<time-at-step-5>" },
                { "seq": 7, "eventType": "4R", "boutTime100ms": "<time-at-step-13>" }
            ]
        },
        "events": [
            { "seq": 1, "eventType": "ScoresheetReleased" },
            { "seq": 2, "eventType": "T_Started", "boutTime100ms": "<time-at-step-3>" },
            { "seq": 3, "eventType": "1B", "boutTime100ms": "<time-at-step-5>" },
            { "seq": 4, "eventType": "T_Stopped", "boutTime100ms": "<time-at-step-7>" },
            { "seq": 5, "eventType": "T_Started", "boutTime100ms": "<time-at-step-9>" },
            { "seq": 6, "eventType": "T_Stopped", "boutTime100ms": "<time-at-step-11>" },
            { "seq": 7, "eventType": "4R", "boutTime100ms": "<time-at-step-13>" },
            {
                "seq": 8,
                "eventType": "ScoresheetCompleted",
                "victoryType": "SS",
                "classificationPoints": [4, 0]
            }
        ]
    }
}
```

## Main scenario

1. User presses key `F4` to release the scoresheet.
2. Website changes to state "Recording" as defined in `02-ui-specification.md`. Cursor is on `next-event`.
3. User presses key `Space` to start bout time.
4. Bout time starts counting down.
5. User inputs key sequence `1B`.
6. Timeline gets bout event `1B` inserted before `next-event` along with current bout time. Score of blue is updated. Cursor remains on `next-event`.
7. User presses key `Space` to stop bout time.
8. Bout time stops counting down.
9. User presses key `Space` to start bout time.
10. Bout time starts counting down.
11. User presses key `Space` to stop bout time.
12. Bout time stops counting down.
13. User inputs key sequence `4R`.
14. Timeline gets bout event `4R` inserted before `next-event` along with current bout time. Score of red is updated. Cursor remains on `next-event`.
15. User presses key `F4` to complete the scoresheet.
16. The completion form appears in `center` below `release-complete-button`.
17. User selects red as winner and the victory type "Schultersieg".
18. The classification points are shown according to victory type and winner. The classification points are input fields, so the user can edit them if needed.
19. User confirms the completion form.
20. The scoresheet is completed (state "Idle" in `02-ui-specification.md`) and additionally shows a button to export the scoresheet as JSON in `center` below `release-complete-button`.
21. User presses the key `F8`.
22. The scoresheet is exported as a JSON file and downloaded to the user's device.
