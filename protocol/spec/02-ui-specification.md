# UI Specification for CHAMP Protocol

This document specifies the user interface (UI) for the CHAMP Protocol.

- [overview document](00-overview.md)
- [specification document](01-specification.md)

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
