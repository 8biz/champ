# CHAMP Protocol — Overview

The CHAMP protocol is a tool for live recording of wrestling matches in the form of a digital scorecard. With this tool, users can record all events during a bout, including points, passivity, warnings, injury time, and time control.

---

## Key features of the CHAMP Protocol:
- **Live recording of wrestling matches**: Record all events and corrections during a bout with timestamps in the event log for accurate tracking
- **JSON export of the complete event log**: Export the recorded events in a structured JSON format for archiving, further processing, or analysis.
- **Offline-capable HTML5 application**: The tool is designed as a single HTML file that can be used on both desktop and mobile devices without the need for installation.
- **Intuitive input**: The user interface is designed for fast and secure operation, allowing users to record events quickly using keyboard, touchscreen, or mouse input.

---

## Target audience and use cases 🎯

### Primary users
People that have knowledge of wrestling rules and scoring.
They are not necessarily tech-savvy, so the tool must be intuitive and require minimal training.
The target use case is recording live bouts in competitions, where speed and accuracy are essential.

### Internationalization
At first the tool appears in **German**.

It shall be able to use the tool worldwide. Therefore, all text in the UI should be easily translatable and support internationalization. Keyboard shortcuts should be designed to work across different keyboard layouts. At least English should be supported as a second language, and the tool should be designed to allow adding more languages in the future.

---

## Terminology 📚
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

## High-level Workflow 🔁
1. User opens the HTML file in a browser (desktop or mobile). A **New scoresheet** is shown with names "Rot" and "Blau" for the wrestlers. It is ready to be released for recording.
    - Optionally: **Prepare scoresheet:** User can do some settings before releasing the scoresheet for event recording.
3. **Recording events:** User records events as they happen in the bout. The user can also make corrections to past events if needed.
4. **Complete bout:** When time is over or victory condition is reached, user completes the bout by entering victory type and classification points. May be, user makes some corrections like bout or wrestler info if needed. If the bout is completed, the user can export JSON.

---

## Main elements of the scoresheet 📝
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

## Implementation constraints 📌
- Single HTML file, no backend, offline-first, minimal dependencies.
- No reloading of images. Use inline SVG or base64-encoded images.
- Use modern web APIs and standards for best performance and compatibility.
- Design for accessibility and usability, especially for live recording scenarios (e.g., large buttons, clear feedback, keyboard shortcuts).
- Responsive design for different screen sizes on both desktop and mobile browsers.
- The tool should be designed to allow adding more features in the future, such as additional or modified rulesets, more event types, or integration with external systems.

- All features shall be tested with unit tests and end-to-end tests (e.g., using Playwright) to ensure reliability during live recording.
- Use a modular and maintainable code structure by using design patterns and best practices to allow for future enhancements and bug fixes.
- Use a consistent and clear naming convention for variables, functions, and events to improve readability and maintainability of the code.
- Document the code and the event types clearly to facilitate understanding and future development by other contributors.
- Use a github codespace for development to ensure a consistent environment and easy collaboration.
- Use github actions for continuous integration and testing to ensure code quality and catch issues early.
- The specification and implementation language is English.

---

## Further readings 📖
- [common specification document](01-specification.md).
- [UI specification document](02-ui-specification.md).

---
