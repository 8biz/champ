# Use Case 002 - Short bout

Summary: User releases the scoresheet, records a short bout, complete it and stores the json export.

## Preconditions

User has opened a new scoresheet regarding to `uc001-new-scoresheet.md`.

## Postconditions




## Main scenario

1. User presses key `F4` to release the scoresheet.
2. Website changes
    - "Release-Complete-Button" changes "Abschließen [F4]".
    - Elements "bout-info", "wrestler-red-info" and "wrestler-blue-name" gets freezed.
    - The bout event buttons gets enabled
    - Timeline shows **Next event entry** to show next entry to insert. Cursor is on this entry.
3. User presses key `Space` to start bout time.
4. Bout time starts counting down.
5. User inputs key sequence `1B`.
6. Timeline gets bout event `1B` inserted before **Next event entry** along with current bout time. Cursor remains on **Next event entry** entry.
7. Score of blue
7. User presses key `Space` to stop bout time.
8. Bout time stopps counting down.
9. User presses key `Space` to start bout time.
10. Bout time starts counting down.
11. User presses key `Space` to stop bout time.
12. Bout time stopps counting down.
13. User inputs key sequence `4R`.
14. Timeline gets bout event `4R` inserted before **Next event entry** along with current bout time.
15. User presses key `F4` to complete the scoresheet.
