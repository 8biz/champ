# CHAMP Protocol — Specification (concise)


## Overview ✅
CHAMP Protocol is a single-file, offline-capable HTML5 tool to record wrestling bouts. It is optimized for quick keyboard entry, touch/mouse input, and produces a complete event-sourced JSON export for replay, analysis, and archival.

- **Purpose:** Create a digital scoresheet that records all bout events (points, passivity, cautions, injury times, time control) and exports both presentation and authoritative event logs as JSON.
- **Primary users:** People that have knowledge of wrestling rules and scoring. They are not necessarily tech-savvy, so the tool must be intuitive and require minimal training. The target use case is recording live bouts in competitions, where speed and accuracy are essential.
- **Implementation constraints:** Single HTML file, no backend, offline-first, minimal dependencies. No images, if needed use inline SVG or base64-encoded images. Use modern web APIs and standards for best performance and compatibility.

This document describes
- structure of the scoresheet
- high-level workflow
  - Preparing the scoresheet
  - Recording events in Normal mode and in Correction mode
  - Completing the bout
- event specification
- timeline specification
- the keyboard and mouse input specifications
- ruleset format
- JSON export format

---

## Structure of the scoresheet 📝
- **Bout info**: free-form text field for bout info (e.g. competition, age group, weight class, ...).
- **Wrestler red** and **Wrestler blue** sections, each containing:
  - wrestler info: free-form text field for wrestler info (e.g. name, club, nation, ...).
  - score: auto-calculated from events.
  - injury times for both without and with blood.
- **Release-Completion button**: button to release the scoresheet for recording and to complete the bout when finished.
- **Bout time**: shows current bout time in "M:SS.f" format
- **Event buttons red** and **Event buttons blue**: buttons for bout events (awarding points, passivity, cautions for each wrestler).
- **Timeline**: chronological list of bout events with time.

---

## High-level Workflow 🔁
1. User opens the HTML file in a browser (desktop or mobile). A **New scoresheet** is shown.
2. **Prepare scoresheet:** User can do some settings before releasing the scoresheet for event recording.
3. **Recording events:** User records events as they happen in the bout. The user can also make corrections to past events if needed.
4. **Complete bout:** When time is over or victory condition is reached, user completes the bout by entering victory type and classification points. May be, user makes some corrections like bout or wrestler info if needed. If the bout is completed, the user can export JSON.

---

## Preparing Scoresheet 📝

The **info fields** are enabled for user input while preparing the scoresheet.
The **Release-Completion button** shows "Release" and is enabled. Once the user clicks "Release", these fields are locked and event recording can start.


### Info fields
- Mandatory: User selects wrestling style **Freestyle** | **Greco-Roman**.
- Optional: User selects ruleset from a dropdown. One ore more pre-defined rulesets are included and the first one is selected by default. Users can load custom rulesets via file input.
- Optional: user fills bout info in a text field. See **Edit text specification** below.
- Optional: user fills info for Red and Blue wrestlers. The first pair is always the key "Name". If not filled, name defaults to "Red" and "Blue". If the first key is not "Name", it is ignored and replaced with "Name". See **Edit text specification** below.


### Edit text specification:
- Text can be comma-separated key-value pairs.
- Key-value separator is ':', pair separator is ';'.
- Keys must be unique.
- A pair with a key beginning with '$' is named an **anonymous pair**. The key is not shown in the UI, but the value.
- A pair with a key beginning with '$$' is named a **hidden pair**. Neither the key nor the value is shown in the UI. It's intended for keeping metadata.
- A pair with a key that does not follow the above rules is a **named pair**. Both, key and value are shown in the UI.
- User can omit the key for any pair, in that case it defaults to "$anonym1", "$anonym2", etc.

**Examples:**
  - "Competition: State Championship; U17 74kg"
    - 2 pairs
    - First named pair has key "Competition" and value "State Championship"
    - Second anonymous pair has key "$anonym1" with value "U17 74kg".
  - "Name: Max Mustermann; $$id: 23; Club: KSV Ringerhimmel; $Region: Südbaden $Nation: Germany"
    - 5 pairs
    - First named pair with key "Name" and value "Max Mustermann"
    - Second hidden pair with key "$$id" and value "23"
    - Third named pair with key "Club" and value "KSV Ringerhimmel"
    - Fourth anonymous pair with key "$anonym1" and value "Südbaden"
    - Fifth anonymous pair with key "$anonym2" and value "Germany"
  - "Friendly bout"
    - 1 pair
    - Anonymous pair with key "$anonym1" and value "Friendly bout"

---

## Recording Events 🎯

The user can record **events** in real-time as the bout progresses. 

- Events are recorded consecutively and stored in an **event log**. This log is the source of truth for the bout history and is used to generate the timeline and calculate scores. It can only be appended to, but not modified. Corrections are made by adding new events that reference the original event.
- Each **event** is recorded at least with a unique sequence number, a timestamp and event type. See **Event Specification** for details on event types and their fields.
- The user can record events by using the buttons in the UI or by using keyboard shortcuts. See **Mouse & Touch Input Specification** or **Keyboard Input Specification** for details.
- The **timeline** reflects the sequence of bout events. See **Timeline Specification** for details.

### Normal mode

Recording events when cursor is at timeline end.

- This is the default mode after releasing the scoresheet and after confirming corrections.
- The user can edit the value of the bout or an injury time (See **Time modification mode**). This leads to `T_Edit`, `T_IR_Edit`, `T_IB_Edit`, `T_BR_Edit` or `T_BB_Edit` event being recorded.
- The user can enter **Correction mode** to make corrections to historical events.
  - Is entered by moving the **cursor** to a historical **event** 
  - See **Correction mode** for details.
- The user can complete the bout. See **Complete bout** section for details.

### Correction mode

Correcting events when cursor is on a historical event.

- Only on confirmation, the corresponding correction events are recorded in the event log. This allows the user to make multiple corrections and confirm them all at once. Then Normal mode is entered. The cursor moves to the timeline end.
- On cancellation of correction, the event log remains unchanged. Normal mode is entered. The cursor moves to the timeline end.

The user can
- modify type of bout event (see Event Specification) inputting an other bout event type. Then a `EventModified` event with additional field `newEventType` is recorded. 
- modify the bout time (see **Time modification mode**). Then a `EventModified` event with additional field `newBoutTime100ms` is recorded.
- delete the current event. Results in a `EventDeleted` event being recorded.
- enter the **Event swap mode** to change the order of events in the timeline.
  - The cursor changes its visual style to indicate the **Event swap mode**.
  - The user can move the current event left or right.
  - In the timeline, this swaps the event types but not the bout times.
  - Results in a `EventSwapped` event being recorded.
- enter the **Event insert mode** to insert a new event prior to the current event.
  - Then the user has to input a bout event type.
  - Optionally, the user can also input a bout time for the inserted event (see **Time modification mode**). If no time is input, the time of the current event is used.
  - Results in an `EventInserted` event being recorded with the corresponding bout time and event type.


### Timer Behavior ⏱️
- Store times as integers in seconds. Use ISO timestamps for absolute time.
- `boutTimeSeconds` is seconds relative to current period start (0..periodLength).
- Automatic actions: when period time expires, stop bout time and mark `isPeriodEnd`. If not final period, start break timer (optional, configured by ruleset).
- Optional feature: automatic detection of victory conditions (e.g., VSU by point difference) should be governed by ruleset options (autoDetect: true/false).


### Time modification mode

When the user want to modify the bout time, one of the injury times or the bout time of an historical event, then
  - a modal pop-up appears near to the time field which is modified. The user can enter a new time in M:SS format (for bout time 100ms are set to 0).
  - On confirmation, the corresponding event is recorded.
  - On cancellation, no event is recorded.

---

## Complete bout 🏁

The bout is over, when a victory condition is reached ahead of bout time or the bout time is runs out.

- The user has to start the completion process manually.
- Then a modal pop-up appears, where the user has to select the victory type and classification points according to the ruleset.
- On confirmation, a `ScoresheetCompleted` event is recorded with the corresponding fields.
- The scoresheet is now locked and no more events can be recorded.
- Changes to bout or wrestler info are still possible and recorded as mentioned in **Event Specification**.
- The **Release-Completion button** changes to "Re-release" and is enabled.
  - This allows the user to enter the **Correction mode** to make corrections to the bout after completion.
  - Entering **Normal mode** is not possible after completion.
  - Then the user has to complete the bout again.
- If the bout is completed, the user can export the scoresheet as JSON. See **JSON Export Format** for details.

---

## Event Specification 📊

### Event record schema
- `seq` (integer, monotonic; mandatory): unique identifier for the event, incremented for each new event.
- `timestamp` (ISO 8601 UTC string; mandatory): time when the event was recorded.
- `eventType` (enum, see tables below; mandatory)
- `boutTime100ms` (integer; optional, see tables below)
- additional fields depending on `eventType` (see tables below)

### Scoresheet events
| `eventType` | Description |
|---|---|
| `ScoresheetReleased` | User clicks "Release" button to start recording events |
| `ScoresheetCompleted` |Bout completed; additional fields `victoryType` and `classificationPoints` are determined from ruleset |
| `T_Started`, `T_Stopped` | Bout time started/stopped; `boutTime100ms` keeps bout time when started/stopped |
| `PeriodEnd` | Automatically recorded when bout time reaches period length |
| `T_IR_Started`, `T_IR_Stopped`, `T_IB_Started`, `T_IB_Stopped` | Injury time (T_IR/T_IB) started/stopped (without blood); `boutTime100ms` keeps bout time when recorded. |
| `T_BR_Started`, `T_BR_Stopped`, `T_BB_Started`, `T_BB_Stopped` | Blood Time (T_BR/T_BB) started/stopped (with blood); `boutTime100ms` keeps bout time when recorded. |
| `BoutInfoUpdated` | Bout info changed after completion; `newContent` keeps new content |
| `RedInfoUpdated`, `BlueInfoUpdated` | Wrestler info changed after completion; `newContent` keeps new content |

### Bout events
| `eventType` | Description |
|---|---|
| `1R`, `2R`, `4R`, `5R`, `1B`, `2B`, `4B`, `5B` | Technical points; `boutTime100ms` keeps bout time when recorded. |
| `PR`, `PB` | Passivity; `boutTime100ms` keeps bout time when recorded. |
| `0R1B`, `0R2B`, `0B1R`, `0B2R` | Cautions; `boutTime100ms` keeps bout time when recorded. |

### Correction events
| `eventType` | Description |
|---|---|
| `EventModified` | Event modified in correction mode; additional field `refSeq` keeps the `seq` of the original event; additional field `newEventType` when event type is changed or `newBoutTime100ms` when bout time is changed |
| `EventSwapped` | Two events swapped in correction mode; additional field `refSeq1` keeps the `seq` of the first event; additional field `refSeq2` keeps the `seq` of the second event |
| `EventDeleted` | Event deleted in correction mode; additional field `refSeq` keeps the `seq` of the deleted event |
| `EventInserted` | Event inserted in correction mode; additional field `boutTime100ms` keeps bout time of the event before which it was inserted; additional field `refSeq` keeps the `seq` of the event before which it was inserted; additional field `insertedEventType` keeps the `eventType` of the inserted event |
| `T_Edit` | Bout time manually edited; `boutTime100ms` keeps bout time before edit. Additional field `newTime` keeps new bout time |
| `T_IR_Edit`, `T_IB_Edit`, `T_BR_Edit`, `T_BB_Edit` | Injury/Blood time manually edited; `boutTime100ms` keeps bout time before edit. Additional field `newTime` keeps new bout time |

---

## Timeline Specification 📜

- The timeline reflects the sequence of bout events and is updated in real-time.
- The **cursor** indicates the current position in the timeline for recording new events or making corrections.
- The timeline supports several entry types:
  - **Bout events**: points, passivity, cautions (e.g., 1R, 2B, PR, 0B1R, etc.) along with their bout time.
  - **Period end**: Is automatically inserted, when a period ends. It shows the scores of red and blue at the end of the period and is visually distinct from bout events.


---

## Keyboard Input Specification ⌨️✨
General rules:
- Input is processed by a **sequence buffer** (array of keys).
  - No timeout.
  - Escape clears the buffer.
  - Invalid keys are ignored and do not mutate the buffer.
  - Keys are case-insensitive.
- Supports following modes:
  - **Normal mode**: recording at timeline end
  - **Correction mode**: cursor on historical slot.
  - **Time modification mode**: entering a new time for an historical slot. Sub-mode of Correction mode.
  - **Sequence correction mode**: Adding, deleting or moving an event in the timeline. Sub-mode of Correction mode.
- Some keys (Space, Esc, Delete) are global.

### Key sequences in _Normal mode_
- Space: start/stop bout time
- R + 1 | 2 | 4 | 5  => R1, R2, R4, R5 (Red points)
- B + 1 | 2 | 4 | 5 => B1, B2, B4, B5 (Blue points)
- R + P => RP (Red passivity); B + P => BP
- R + 0 + 1 => R0B1 (Red caution, Blue +1)
- R + 0 + 2 => R0B2 (Red caution, Blue +2)
- B + 0 + 1 => B0R1; B + 0 + 2 => B0R2
- R + + => R+ (start/stop injury without blood); R + * => R* (with blood). Same for B
- Left arrow key: move cursor left (enter _Correction mode_)

### Key sequences in _Correction mode_
- Enter confirms correction on the current slot and moves cursor to timeline end (enter _Normal mode_).
- Left/Right arrow keys confirms correction on the current slot and moves cursor left/right (stay in _Correction mode_).
- Escape resets current slot if corrections were made. Stays on current slot and stays in _Correction mode_.
- Escape moves cursor to timeline end and enters _Normal mode_ if no corrections were made on the current slot.
- R | B changes the color of the current event, but not points, passivity or caution. A caution, for example B0R1, becomes R0B1.
- 1 | 2 | 4 | 5 | P changes the points or passivity of the current event, but not the color. Cautions become points or passivity (e.g. R0B2 becomes R1 when 1 is pressed).
- 0 + 1 | 0 + 2 changes to a caution, but not the color. Points or passivity become cautions (e.g. R2 becomes R0B2 if 02 is entered, R0B2 becomes R0B1 if 01 is entered).
- Delete key removes the current event (recording an EventDeleted) and moves cursor to next slot in timeline (stays in _Correction mode_).
- \# key enters _Move mode_:
  - Left/Right arrows move the current event to the previous/next slot (swapping with that event). This allows changing the order of events. Enter confirms and returns to _Correction mode_. Escape cancels and returns to _Correction mode_ without changes. 
- T enters the _Time modification mode_:
  - The user can enter a new time in M:SS format (e.g. 1:30). The buffer accepts digits and colon.
  - On Enter, the boutTimeSeconds of the current slot is updated to the new value (converted to seconds). Returns back to _Correction mode_
  - Escape cancels time correction and returns back to _Correction mode_.

Notes:
- '+' and '*' must be accepted from main keyboard and numpad. Digit keys accept main and numpad digits.
- Backspace acts as same as Left-Arrow.
- After a complete sequence executes, the buffer is cleared.
- Invalid continuation keys are ignored (e.g., after R0, only '1' or '2' are accepted; other keys are ignored).

---

## Mouse & Touch Input Specification🖱️📱

Buttons for common actions (start/stop time, award points, passivity, cautions, start/stop injury times) are be provided.
Clicking a slot in the timeline moves the cursor to that slot (entering _Correction mode_). 

---

## JSON Ruleset Format 📚

---

## JSON Export Format 📦
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

