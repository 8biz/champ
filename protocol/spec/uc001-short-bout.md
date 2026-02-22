# Use Case 002 - Short bout

Summary: User releases the scoresheet, records a short bout, completes it, and stores the JSON export.

## Preconditions

User has opened a new scoresheet in state "Idle" as defined in `02-ui-specification.md`.

## Postconditions

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
17. User selects the winner and the victory type.
18. The classification points are shown according to victory type and winner. The classification points are input fields, so the user can edit them if needed.
19. User confirms the completion form.
20. The scoresheet is completed (state "Idle" in `02-ui-specification.md`) and additionally shows a button to export the scoresheet as JSON in `center` below `release-complete-button`.
21. User presses the export button.
22. The scoresheet is exported as a JSON file and downloaded to the user's device.
