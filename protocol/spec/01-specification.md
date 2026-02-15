# CHAMP Protocol — Specification (concise)


## Overview ✅
CHAMP Protocol is a single-file, offline-capable HTML5 tool to record wrestling bouts. It is optimized for quick keyboard entry, touch/mouse input, and produces a complete event-sourced JSON export for replay, analysis, and archival.

- **Purpose:** Create a digital scoresheet that records all bout events (points, passivity, cautions, injury times, time control) and exports both presentation and authoritative event logs as JSON.
- **Primary users:** People that have knowledge of wrestling rules and scoring. They are not necessarily tech-savvy, so the tool must be intuitive and require minimal training. The target use case is recording live bouts in competitions, where speed and accuracy are essential.
- **Internationalization:** At first the tool appears in **German**. But the tool shall be able to be used worldwide. Therefore, all text in the UI should be easily translatable and support internationalization. Keyboard shortcuts should be designed to work across different keyboard layouts.
- **Implementation constraints:** Single HTML file, no backend, offline-first, minimal dependencies. No images, if needed use inline SVG or base64-encoded images. Use modern web APIs and standards for best performance and compatibility.
- The specification and implementation language is English.

This document describes
- overview and goals of the CHAMP Protocol
  - terminology
  - high-level workflow
  - structure of the scoresheet
- Preparing the scoresheet
- Recording events in Normal mode and in Correction mode
- Completing the bout
- event specification
- timeline specification
- the keyboard and mouse input specifications
- ruleset format
- JSON export format

---

### Terminology 📚

| Term | Definition |
|---|---|
| **Scoresheet** | The overall HTML file that contains all bout information, timeline, and controls. |
| **Bout event** | An event that affects the score or state of the bout (e.g., awarding points, passivity, cautions). |
| **Time control event** | An event that starts or stops a timer (e.g., period time, injury time). |
| **Event log** | The chronological list of all events recorded during the bout, including corrections. |
| **Timeline** | The visual representation of the bout events in chronological order, showing event types and times. |
| **Cursor** | The current position in the timeline for recording new events or making corrections. |
| **Period time** | The timer that counts the duration of the current period. |
| **Bout time** | The timer that counts the total duration of the bout. Always counting up |
| **Injury time** | The timer that counts the duration of an injury timeout. There are two types: without blood and with blood per wrestler. |

---

### High-level Workflow 🔁
1. User opens the HTML file in a browser (desktop or mobile). A **New scoresheet** is shown with names "Rot" and "Blau" for the wrestlers. It is ready to be released for recording.
    - Optionally: **Prepare scoresheet:** User can do some settings before releasing the scoresheet for event recording.
3. **Recording events:** User records events as they happen in the bout. The user can also make corrections to past events if needed.
4. **Complete bout:** When time is over or victory condition is reached, user completes the bout by entering victory type and classification points. May be, user makes some corrections like bout or wrestler info if needed. If the bout is completed, the user can export JSON.

---

### Structure of the scoresheet 📝
- **Bout info**: free-form text field for bout info (e.g. competition, age group, weight class, ...).
- **Wrestler red** and **Wrestler blue** sections, each containing:
  - wrestler info: free-form text field for wrestler info (e.g. name, club, nation, ...).
  - score: auto-calculated from events.
  - injury times for both without and with blood.
- **Release-Completion button**: button to release the scoresheet for recording and to complete the bout when finished.
- **Period time**: shows current period time in "M:SS.f" format
- **Event buttons red** and **Event buttons blue**: buttons for bout events (awarding points, passivity, cautions for each wrestler).
- **Timeline**: chronological list of bout events with time.

---

## Preparing Scoresheet 📝

The **info fields** are enabled for user input while preparing the scoresheet.
The **Release-Completion button** shows "Release" and is enabled. Once the user clicks "Release", these fields are locked and event recording can start.


### Info fields
- Mandatory: User selects wrestling style **Freestyle** | **Greco-Roman**.
- Optional: User selects ruleset from a dropdown. One ore more pre-defined rulesets are included and the first one is selected by default. Users can load custom rulesets via file input.
- Optional: user fills bout info in a text field. See **Edit text specification** below.
- Optional: user fills info for Red and Blue wrestlers. The first pair is always the key "Name". If the first key is not "Name", it is ignored and replaced with "Name". See **Edit text specification** below.


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
- The user can input time control events. See **Timer Behavior**.
- When the period time runs out
  - additionally a `PeriodEnd` event is logged.
  - If it's not the final period, the break time, as configured by ruleset, starts automatically.
  - The break time is shown until it runs out. After break time ends, the period time is not automatically started. The user has to start it manually.
- The user can input bout events.
- The user can edit the value of the bout or an injury time (See **Time modification mode**).
- The user can enter **Correction mode** to make corrections to historical events.
  - Is entered by moving the **cursor** to a historical **event** 
  - See **Correction mode** for details.
- The user can complete the bout. See **Complete bout** section for details.

### Correction mode

Correcting events when cursor is on a historical event. Corrections are stored in separate buffer and only recorded in the event log when the user confirms the corrections. This allows the user to make multiple corrections and confirm them all at once. 

- On confirmation, the correction buffer is recorded in the event log. The correction buffer is then cleared. Normal mode is entered.
- On cancellation, the event log remains unchanged. The correction buffer is cleared. Normal mode is entered.

The user can
- modify type of bout event (see Event Specification) inputting an other bout event type. Then a `EventModified` event with additional field `newEventType` is recorded. 
- modify the period time (see **Time modification mode**). Then a `EventModified` event with additional field `newBoutTime100ms` is recorded.
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

- Times are stored as integers in 100ms accuracy.
- The ruleset defines the period length and the counting direction (up or down) for each timer.
- When the user starts or stopps the timer, the corresponding `_Started` or `_Stopped` event is logged.
- When the period time runs out, the timer is stopped automatically. The corresponding `_Stopped` event is logged.


### Time modification mode

When the user want to modify the period time, one of the injury times or the bout time of an historical event, then
  - a modal pop-up appears near to the time field which is modified. The user can enter a new time in M:SS format (for period time 100ms are set to 0).
  - On confirmation, the corresponding `_Modified` event is recorded.
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
| `BoutInfoUpdated` | Bout info changed after completion; `newContent` keeps new content |
| `RedInfoUpdated`, `BlueInfoUpdated` | Wrestler info changed after completion; `newContent` keeps new content |

### Bout events
| `eventType` | Description |
|---|---|
| `1R`, `2R`, `4R`, `5R`, `1B`, `2B`, `4B`, `5B` | Technical points; `boutTime100ms` keeps bout time when recorded. |
| `PR`, `PB` | Passivity; `boutTime100ms` keeps bout time when recorded. |
| `0R1B`, `0R2B`, `0B1R`, `0B2R` | Cautions; `boutTime100ms` keeps bout time when recorded. |

### Time control events
| `eventType` | Description |
|---|---|
| `T_Started`, `T_Stopped` | Bout time started/stopped; `boutTime100ms` keeps bout time when started/stopped |
| `T_IR_Started`, `T_IR_Stopped`, `T_IB_Started`, `T_IB_Stopped` | Injury time (T_IR/T_IB) started/stopped (without blood); `boutTime100ms` keeps bout time when recorded. |
| `T_BR_Started`, `T_BR_Stopped`, `T_BB_Started`, `T_BB_Stopped` | Blood Time (T_BR/T_BB) started/stopped (with blood); `boutTime100ms` keeps bout time when recorded. |
| `PeriodEnd` | Automatically recorded when period time runs out. |


### Correction events
| `eventType` | Description |
|---|---|
| `EventModified` | Event modified in correction mode; additional field `refSeq` keeps the `seq` of the original event; additional field `newEventType` when event type is changed or `newBoutTime100ms` when bout time is changed |
| `EventSwapped` | Two events swapped in correction mode; additional field `refSeq1` keeps the `seq` of the first event; additional field `refSeq2` keeps the `seq` of the second event |
| `EventDeleted` | Event deleted in correction mode; additional field `refSeq` keeps the `seq` of the deleted event |
| `EventInserted` | Event inserted in correction mode; additional field `boutTime100ms` keeps bout time of the event before which it was inserted; additional field `refSeq` keeps the `seq` of the event before which it was inserted; additional field `insertedEventType` keeps the `eventType` of the inserted event |
| `T_Modified` | Bout time manually edited; `boutTime100ms` keeps bout time before edit. Additional field `newTime` keeps new bout time |
| `T_IR_Modified`, `T_IB_Modified`, `T_BR_Modified`, `T_BB_Modified` | Injury/Blood time manually edited; `boutTime100ms` keeps bout time before edit. Additional field `newTime` keeps new bout time |

---

## Timeline Specification 📜

- The timeline reflects the sequence of bout events and is updated in real-time.
- The timeline supports several entry types:
  - **Bout event entry**: Shows bout event type (points, passivity, cautions) along with the bout time when recorded.
  - **Bout event insert entry**: Shows an empty bout event entry, visually distinct from bout event entries, colored neutrally. On inputting an event type, it becomes a normal bout event entry.
  - **Period end entry**: Is automatically inserted, when a period ends. It shows the scores of red and blue at the end of the period and is visually distinct from bout events entries.
- The **Next event entry** is a special entry in Normal mode at the end of the timeline that indicates where the next event will be recorded. It is visually the same as a bout event insert entry.
- The **cursor** highlights the entry at the current position in the timeline.
  - In Normal mode, this is always the Next event entry.
  - In Correction mode, this is the historical event entry that is being corrected.

---

## Keyboard Input Specification ⌨️✨

### General rules
- Input is processed by a **sequence buffer** (array of keys) without timeout.
- After a complete sequence executes, the buffer is cleared.
- `Escape` clears the buffer.
- Invalid continuation keys are ignored (e.g., after R0, only '1' or '2' are accepted; other keys are ignored).
- Invalid keys are ignored and do not mutate the buffer.
- Keys are case-insensitive.

### Key sequences for scoresheet preparation
| `eventType` | Key Sequence | Action |
|---|---|---|
| `ScoresheetReleased` | `F4` | Release scoresheet for recording, if not released; Re-release scoresheet if completed |
| `ScoresheetCompleted` | `F4` | Complete bout, if scoresheet is recording |
| `BoutInfoUpdated` | `F5` | Edit bout info (enter **Edit text mode**) |
| `RedInfoUpdated` | `F6` | Edit Red wrestler info (enter **Edit text mode**) |
| `BlueInfoUpdated` | `F7` | Edit Blue wrestler info (enter **Edit text mode**) |


### Key sequences in Normal mode
| `eventType` | Key Sequence | Action |
|---|---|---|
| `T_Started` / `T_Stopped` | `Space` | Start/stop period time |
| `1R` | `R` + `1` / `1` + `R` | Award 1 point to Red (1R) |
| `2R` | `R` + `2` / `2` + `R` | Award 2 points to Red (2R) |
| `4R` | `R` + `4` / `4` + `R` | Award 4 points to Red (4R) |
| `5R` | `R` + `5` / `5` + `R` | Award 5 points to Red (5R) |
| `1B` | `B` + `1` / `1` + `B` | Award 1 point to Blue (1B) |
| `2B` | `B` + `2` / `2` + `B` | Award 2 points to Blue (2B) |
| `4B` | `B` + `4` / `4` + `B` | Award 4 points to Blue (4B) |
| `5B` | `B` + `5` / `5` + `B` | Award 5 points to Blue (5B) |
| `PR` | `R` + `P` / `P` + `R` | Red passivity (PR) |
| `PB` | `B` + `P` / `P` + `B` | Blue passivity (PB) |
| `0R1B` | `R` + `0` + `1` / `0` + `R` + `1` | Red caution, Blue +1 (0R1B) |
| `0R2B` | `R` + `0` + `2` / `0` + `R` + `2` | Red caution, Blue +2 (0R2B) |
| `0B1R` | `B` + `0` + `1` / `0` + `B` + `1` | Blue caution, Red +1 (0B1R) |
| `0B2R` | `B` + `0` + `2` / `0` + `B` + `2` | Blue caution, Red +2 (0B2R) |
| `T_IR_Started` / `T_IR_Stopped` | `R` + `,` / `,` + `R` | Start/stop Red injury time |
| `T_BR_Started` / `T_BR_Stopped` | `R` + `.` / `.` + `R` | Start/stop Red blood time |
| `T_IB_Started` / `T_IB_Stopped` | `B` + `,` / `,` + `B` | Start/stop Blue injury time |
| `T_BB_Started` / `T_BB_Stopped` | `B` + `.` / `.` + `B` | Start/stop Blue blood time |
| — | `Left arrow` or `Backspace` | Move cursor left (enter Correction mode) |

### Key sequences in Correction mode
| `eventType` | Key Sequence | Action |
|---|---|---|
| — | `Enter` | Confirm corrections and enter **Normal mode**. Key sequence buffer is ignored and cleared. |
| — | `Escape` | If key sequence buffer is empty, cancels corrections and enter **Normal mode**. Otherwise, clears key sequence buffer. |
| — | `Left arrow` / `Right arrow` | Move cursor left or right (stay in **Correction mode**) |
| `EventModified` | `R` | Change color of current event to Red (keeps points/passivity/caution type; e.g., `1R` becomes `1B`, `0B1R` becomes `0R1B`) |
| `EventModified` | `B` | Change color of current event to Blue (keeps points/passivity/caution type) |
| `EventModified` | `1` | Change current event to 1 point (keeps color; cautions become points; e.g., `4R` becomes `1R`, `0R2B` becomes `R1`) |
| `EventModified` | `2` | Change current event to 2 points (keeps color) |
| `EventModified` | `4` | Change current event to 4 points (keeps color) |
| `EventModified` | `5` | Change current event to 5 points (keeps color) |
| `EventModified` | `P` | Change to passivity (keeps color) |
| `EventModified` | `0` + `1` | Change to caution +1 (keeps color; points/passivity become cautions; e.g., `2R` becomes `0R1B`) |
| `EventModified` | `0` + `2` | Change to caution +2 (keeps color; points/passivity become cautions; e.g., `1B` becomes `0B2R`) |
| `EventDeleted` | `Delete` | Remove current event |
| `EventInserted` | `Insert` + (event key sequence for a bout event) | Insert a new event prior to the current event by showing a bout event insert entry. |
| `EventSwapped` | `#` | Enter **Event swap mode** (use `Left arrow`/`Right arrow` to select the event to swap with; `Enter` confirms swapping, `Escape` cancels) |
| `T_Modified` / `T_IR_Modified` / `T_IB_Modified` / `T_BR_Modified` / `T_BB_Modified` | `T` | Enter **Time modification mode** (enter new time in M:SS format; `Enter` confirms, `Escape` cancels) |

---

## Mouse & Touch Input Specification🖱️📱

### General rules
- All button interactions map to corresponding events defined in the **Event Specification**.
- Buttons trigger events with a single click (desktop) or tap (mobile).
- Clicking/tapping a timeline entry moves the cursor to that entry and enters **Correction mode** in **Modify event mode**.
- Long-pressing (touch) or right-clicking (desktop) a timeline entry shows a context menu with options to delete, insert, or swap events, and enters **Correction mode** in **Sequence correction mode**.

### Button controls for scoresheet preparation
| `eventType` | Button / Control | Action |
|---|---|---|
| `ScoresheetReleased` | **Release-Complete** button | Release scoresheet for recording, if not released |
| `ScoresheetCompleted` | **Release-Complete** button | Complete bout, if scoresheet is recording |
| `ScoresheetReleased` | **Release-Complete** button | Re-release scoresheet after completion for correction mode |
| `BoutInfoUpdated` | **Edit Bout Info** button | Edit bout info (enter **Edit text mode**) |
| `RedInfoUpdated` | **Edit Red Info** button | Edit Red wrestler info (enter **Edit text mode**) |
| `BlueInfoUpdated` | **Edit Blue Info** button | Edit Blue wrestler info (enter **Edit text mode**) |

### Button controls in Normal mode
| `eventType` | Button / Control | Action |
|---|---|---|
| `T_Started` / `T_Stopped` | Click/tap bout time field | Start/stop period time |
| `1R` | **1R** button | Award 1 point to Red |
| `2R` | **2R** button | Award 2 points to Red |
| `4R` | **4R** button | Award 4 points to Red |
| `5R` | **5R** button | Award 5 points to Red |
| `1B` | **1B** button | Award 1 point to Blue |
| `2B` | **2B** button | Award 2 points to Blue |
| `4B` | **4B** button | Award 4 points to Blue |
| `5B` | **5B** button | Award 5 points to Blue |
| `PR` | **PR** button | Red passivity |
| `PB` | **PB** button | Blue passivity |
| `0R1B` | **0R1B** button | Red caution, Blue +1 |
| `0R2B` | **0R2B** button | Red caution, Blue +2 |
| `0B1R` | **0B1R** button | Blue caution, Red +1 |
| `0B2R` | **0B2R** button | Blue caution, Red +2 |
| `T_IR_Started` / `T_IR_Stopped` | Click/tap time field | Start/stop Red injury time (without blood) |
| `T_BR_Started` / `T_BR_Stopped` | Click/tap time field | Start/stop Red blood time |
| `T_IB_Started` / `T_IB_Stopped` | Click/tap time field | Start/stop Blue injury time (without blood) |
| `T_BB_Started` / `T_BB_Stopped` | Click/tap time field | Start/stop Blue blood time |
| — | Click/tap timeline entry | Move cursor to that entry for modification (enter **Correction mode** in **Modify event mode**) |
| — | Long-press timeline entry | Show context menu for that entry with options to delete, insert, or swap events (enter **Correction mode** in **Sequence correction mode**) | 

### Button controls in Correction mode
| `eventType` | Button / Control | Action |
|---|---|---|
| — | **Confirm** button | Confirm corrections and enter **Normal mode** |
| — | **Cancel** button | Cancel corrections and enter **Normal mode** (enter Normal mode without saving changes) |
| — | Click/tap timeline entry | Move cursor to that entry for modification (**Modify event mode**) |
| — | Long-press/Right-click timeline entry | Show context menu for that entry with options to delete, insert, or swap events (**Sequence correction mode**) | 
| `T_Modified` / `T_IR_Modified` / `T_IB_Modified` / `T_BR_Modified` / `T_BB_Modified` | Long-press/Right-click time field | Enter **Time modification mode** (enter new time via numeric input; **Confirm** to apply, **Cancel** to discard) |

**Modify event mode**
| `eventType` | Button / Control | Action |
|---|---|---|
| `EventModified` | Click any bout event button | Changes event type and color, e.g. click/tap on **2R** button changes any event to `2R` |

**Sequence correction mode**
| `eventType` | Button / Control | Action |
|---|---|---|
| `EventDeleted` | Click **Delete** button in context menu | Remove current event |
| `EventInserted` | Click **Insert** button in context menu + (select bout event button) | Insert a new event prior to the current event by showing a bout event insert entry. |
| `EventSwapped` | Click **Swap** button in context menu | Enter **Event swap mode** (use ◀/▶ buttons to swap with adjacent events; **Confirm** to apply, **Cancel** to discard) |

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
- Correction mode: cursor moves to entry, keyboard sequences update that entry (record an EventChanged). Enter confirms and moves cursor to timeline end. Esc cancels and returns the cursor to the end.

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

