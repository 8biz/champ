# CHAMP Protocol — Specification

This document specifies the features provided by CHAMP Protocol.
It covers
- preparation of the scoresheet
- recording of events to the event log
- completion of the bout
- event specification
- timeline specification
- ruleset specification
- export format specification

An overview of the CHAMP Protocol tool can be found in the [overview document](00-overview.md).

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

These events are shown in the timeline.

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
  - The cursor skips the period end entries, as they cannot be corrected.

---

## Ruleset specification ⚙️

Rulesets define the timing rules, victory conditions, and style-specific configurations for wrestling bouts. They are stored as JSON objects and can be embedded in the application or loaded from external files.

### Ruleset schema

#### Root properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `metadata` | object | ✓ | Ruleset identification and authorship information |
| `periodTimesInSeconds` | array of integers | ✓ | Duration of each period in seconds (e.g., `[180, 180]` for two 3-minute periods) |
| `periodTimeCountingDirection` | `"Up"` \| `"Down"` | ✓ | Direction the period clock counts |
| `periodBreakTimeInSeconds` | integer | ✓ | Break duration between periods, in seconds |
| `injuryTimeWithoutBloodInSeconds` | integer | ✓ | Maximum allowed injury stoppage without blood, in seconds |
| `injuryTimeWithBloodInSeconds` | integer | ✓ | Maximum allowed injury stoppage with blood, in seconds |
| `injuryTimeCountingDirection` | `"Up"` \| `"Down"` | ✓ | Direction the injury time clock counts |
| `freestyle` | object | optional | Freestyle-specific timing rules (see below) |
| `victoryTypes` | array | ✓ | List of victory condition objects (see below) |

#### Metadata object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Human-readable ruleset name |
| `description` | string | ✓ | Brief description of the ruleset |
| `version` | string | optional | Ruleset version identifier |
| `languages` | array of strings | ✓ | Supported language codes (e.g., `["de", "en"]`) |
| `author` | string | ✓ | Ruleset author or organization |

#### Freestyle object (optional)

Freestyle wrestling has additional activity time rules that apply under certain conditions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `activityTimeInSeconds` | integer | optional | Duration of activity time in seconds |
| `activityTimeCountingDirection` | `"Up"` \| `"Down"` | optional | Direction the activity time clock counts |
| `activityTimeCondition` | object | optional | Condition object specifying when activity time applies (see Condition Format below) |

#### Victory types array

Each victory type defines how a bout can be won, the classification points awarded, and optional conditions that must be met.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | ✓ | Victory type code (e.g., `"VFA"`, `"VSU"`, `"VPO"`) |
| `description` | string | ✓ | Human-readable description |
| `classificationPoints` | array of 2 integers | ✓ | Points awarded to [winner, loser] (e.g., `[5, 0]` or `[4, 0]`) |
| `condition` | object | optional | Condition object specifying when this victory type applies (see Condition Format below) |

#### Condition format

Conditions use operator-based property matching. Each condition is an object where keys are property names (e.g., `scoreDifference`, `cautionCount`, `passivityCount`) and values are operator objects.

**Supported operators:**
- `gte`: Greater than or equal to
- `lte`: Less than or equal to
- `gt`: Greater than
- `lt`: Less than
- `eq`: Equal to

**Example conditions:**
```json
{
  "scoreDifference": { "gte": 15 }
}
```
Match when score difference is greater than or equal to 15.

```json
{
  "scoreDifference": { "gte": 8, "lte": 14 }
}
```
Match when score difference is between 8 and 14 (inclusive).

```json
{
  "passivityCount": { "gt": 1 }
}
```
Match when passivity count is greater than 1 (i.e., 2 or more).

### Example ruleset snippet

```json
{
  "metadata": {
    "name": "Default German Team Ruleset",
    "description": "Standard rules for German team wrestling",
    "version": "1.0",
    "languages": ["de"],
    "author": "CHAMP Protocol"
  },
  "periodTimesInSeconds": [180, 180],
  "periodTimeCountingDirection": "Down",
  "periodBreakTimeInSeconds": 30,
  "victoryTypes": [
    {
      "type": "VFA",
      "description": "Sieg durch Schultersieg",
      "classificationPoints": [5, 0]
    },
    {
      "type": "VSU",
      "description": "Sieg durch technische Überlegenheit",
      "classificationPoints": [5, 0],
      "condition": {
        "scoreDifference": { "gte": 15 }
      }
    },
    {
      "type": "VPO1",
      "description": "Sieg nach Punkten (1-7 Punkte)",
      "classificationPoints": [3, 0],
      "condition": {
        "scoreDifference": { "gte": 1, "lte": 7 }
      }
    }
  ]
}
```

---

## Export format specification 📤

Completed bouts can be exported as JSON files containing all recorded data, metadata, and computed statistics. The export format is versioned to support future extensions.

### Export schema

#### Root properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `$schema` | string | optional | Reference to the JSON Schema file |
| `exportVersion` | string | ✓ | Export format version (e.g., `"1.0"`) |
| `metadata` | object | ✓ | Application and system metadata (see below) |
| `bout` | object | ✓ | Complete bout data (see below) |

#### Metadata object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `app` | object | ✓ | Application information |
| `system` | object | ✓ | System and environment information |

**App object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Application name (e.g., `"CHAMP Protocol"`) |
| `version` | string | ✓ | Application version |
| `build` | string (ISO 8601) | optional | Build timestamp |

**System object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userAgent` | string | ✓ | Browser user agent string |
| `platform` | string | ✓ | Operating system platform |
| `language` | string | ✓ | Primary browser language |
| `languages` | array of strings | optional | All browser languages |
| `viewport` | object | optional | Viewport dimensions (`width`, `height`) |
| `timestamp` | string (ISO 8601) | ✓ | Export creation timestamp |
| `timezone` | string | optional | System timezone (e.g., `"Europe/Berlin"`) |
| `timezoneOffset` | integer | optional | UTC offset in minutes |

#### Bout object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `header` | object | ✓ | Bout setup information (see below) |
| `summary` | object | ✓ | Computed results and statistics (see below) |
| `events` | array | ✓ | Chronological event log (see Event Specification) |

**Bout header:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `createdAt` | string (ISO 8601) | ✓ | Bout creation timestamp |
| `info` | string | ✓ | Bout info text (competition, weight class, etc.) |
| `style` | `"Freestyle"` \| `"Greco-Roman"` | ✓ | Wrestling style |
| `ruleset` | object | ✓ | Ruleset reference and embedded ruleset object |
| `wrestlers` | object | ✓ | Red and blue wrestler information |

*Ruleset object:*
- `reference` (string, required): Ruleset name
- `embedded` (object, optional): Full embedded ruleset object (see Ruleset specification)

*Wrestlers object:*
- `red` / `blue` (object, required):
  - `info` (string, required): Raw info text
  - `parsedInfo` (object, optional): Parsed key-value pairs from info text

**Bout summary:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `completed` | boolean | ✓ | Whether bout is completed |
| `completedAt` | string (ISO 8601) | optional | Completion timestamp |
| `duration` | object | ✓ | Timing information (see below) |
| `scores` | object | ✓ | Final scores: `{"red": integer, "blue": integer}` |
| `winner` | `"red"` \| `"blue"` \| `"draw"` \| `"none"` | optional | Winner identification |
| `victory` | object | optional | Victory details (see below) |
| `statistics` | object | ✓ | Per-wrestler statistics (see below) |
| `timeline` | array | optional | Filtered bout events with sequence, type, and time |
| `notes` | string | optional | Additional notes |

*Duration object:*
- `totalBoutTime100ms` (integer, required): Total bout time in 100ms units
- `totalRealTime` (integer, optional): Real-world duration in milliseconds
- `periods` (array, optional): Per-period durations (objects with `period` and `duration100ms`)

*Victory object (when bout is completed):*
- `type` (string, required): Victory type code (e.g., `"VFA"`, `"VSU"`)
- `description` (string, required): Human-readable description
- `classificationPoints` (array of 2 integers, required): Points awarded [winner, loser]

*Statistics object:*
- `red` / `blue` (object, required): Per-wrestler statistics
  - `technicalPoints` (object, required): Breakdown by point value: `{"1": count, "2": count, "4": count, "5": count}`
  - `passivity` (integer, required): Passivity count
  - `cautions` (integer, required): Caution count
  - `injuryTime100ms` (integer, optional): Total injury time without blood, in 100ms units
  - `bloodTime100ms` (integer, optional): Total blood time, in 100ms units
- `totalEvents` (integer, required): Total number of events recorded
- `corrections` (integer, optional): Number of correction events

### Usage

Exports are generated via:
```javascript
window.exportHelper.generate()  // Returns export object
window.exportHelper.download()  // Downloads as JSON file
```

Exported files follow the naming pattern: `champ-export-YYYY-MM-DDTHH-MM-SS.json`

---
