# UI Specification for CHAMP Protocol

This document specifies the user interface (UI) for the CHAMP Protocol.

- [overview document](00-overview.md)
- [specification document](01-specification.md)


## UI Design Principles 🎨
- **Simplicity**: The UI should be clean and uncluttered, showing only essential information and controls for recording events during a bout. Advanced features can be accessed through secondary interactions (e.g., long-press, right-click, or a settings menu).
- **Clarity**: Use clear labels, icons, and visual cues to indicate the purpose of each element. For example, use color coding for Red and Blue wrestlers, and distinct icons for different event types (points, passivity, cautions).
- **Responsiveness**: The UI should be responsive and work well on different screen sizes, from desktop to mobile. Controls should be large enough for easy tapping on mobile devices.
- **Accessibility**: Ensure that the UI is accessible to users with disabilities by following best practices for web accessibility, such as using semantic HTML, providing keyboard navigation, and ensuring sufficient color contrast.

### UI Constraints 🎯

- All elements must be shown in the viewport without scrolling.
- The minimum size of the viewport shall be
    - 700px in width and 320px in height for landscape orientation.
    - 320px in width and 700px in height for portrait orientation.
- The UI should adapt to different screen sizes and orientations while maintaining usability and readability.
- Color scheme:
    - The main colors should be dominant red and blue tones, representing the two wrestlers.
    - Neutral tones shall be used for backgrounds, borders, and text to provide contrast and improve readability.
    - Example:
        - Red: #d33131, Blue: #1975d2, Neutral1: #f5f5f5, Neutral2: #9e9e9e, Neutral3: #616161; https://colorkit.co/palette/d33131-1975d2-f5f5f5-9e9e9e-616161/


## Timeline Design Guidelines 📊
- The timeline grows from left to right, with the most recent events on the right.
- The timeline is horizontally scrollable if the number of events exceeds the available width.
- All blocks
    - have the same width capable to take 2 numbers (e.g., "01", "02").
    - have the same height, which is enough to take two rows of numbers.
    - are horizontally and vertically centered.
    - have a surrounding border.
- A **bout event entry** is represented as
    - a colored block (Red or Blue) with two characters representing the event type, e.g.
        - "1R", "2R", "4R", "5R", "1B", "2B", "4B", "5B" for points,
        - "PR" "PB" for passivity,
        - border is solid and has the same color as the block
    - a block with 2 rows for cautions, e.g. a caution for red wrestler:
        - row 1: colored red displaying "0R"
        - row 2: coloted blue displaying "1B" or "2B"
        - vice versa for a caution for blue wrestler
    - The bout time of the event is shown below the block in "M:SS" format.
- A **bout event insert entry** like the **Next event entry** is represented as
    - an empty, neutral, light colored block with a light neutral colored, dashed border. (with cursor on it, it is colored dark neutral, but dashed)
    - Typing a color key (`R` or `B`) changes the block and border color to Red or Blue
    - Typing an event type key (e.g., '1', 'P', '01') changes the characters inside the block accordingly.
        - example1: user types `R`, then `1`: the block becomes a red with a red border at first, then "1" inside.
        - example2: user types `P`, then `B`: the block shows "P", then it becomes blue with a blue border.
        - example3: user types `0`, then `B`, then `2`: The block shows "0", then it becomes a gradient from blue to red with a blue border, then the block shows "02".
        - example4: user types `R`, then `0`, then `B`, then `1`: the block becomes red with a red border, then it shows "0" and it becomes a gradient from red to blue with a red border, then `B` is ignored because it is invalid, then the block shows "01".
- A **period end entry** is represented as
    - a white colored block with a light neutral colored solid border
    - the red colored score of Red wrestler
    - the blue colored score of Blue wrestler a line below.
- The **cursor** highlights the current entry with a dark neutral colored border, even the **Next event entry**.

## Keyboard Input Specification ⌨️✨

### General rules
- Input is processed by a **sequence buffer** (array of keys) without timeout.
- After a complete sequence executes, the buffer is cleared.
- `Escape` clears the buffer.
- Invalid continuation keys are ignored (e.g., after R0, only '1' or '2' are accepted; other keys are ignored).
- Invalid keys are ignored and do not mutate the buffer.
- Keys are case-insensitive.
- Give feedback for current buffer content

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
