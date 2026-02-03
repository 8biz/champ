# What is CHAMP Protocol?

## Purpose

CHAMP Protocol is used to create a digital scoresheet for wrestling bouts. It allows the recorder to log various events during the bout, such as points scored, passivity warnings, cautions, and time management. The tool ensures that all relevant data is captured accurately and can be exported in a structured format (JSON) for further analysis or record-keeping.

## Who will use it?

The primary users of CHAMP Protocol are wrestling specialists, who have a deep understanding of wrestling rules and bout procedures like referees, wrestlers or other deeply interested persons. However, some users may not be very knowledgeable about wrestling, because they want to get into the subject.
The users of CHAMP protocol may not be very familiar with digital tools, so CHAMP Protocol is designed to be user-friendly and intuitive.

## What is the workflow?

1. The recorder opens a new scoresheet.
    - He has to select a ruleset and a wrestling style. See [Ruleset Format](#ruleset-format) for more information.
    - Optionally he can fill in the header section, containing
        - a description like reason for the bout like tournament, team bout or friendly bout as well as age or weight categories
        - description for each wrestler, like its name, team, nation.
2. The recorder releases the scoresheet.
    - Now the tool is enabled to record bout events.
    - The header section is now locked and can not be changed anymore.
3. Recording the bout events
    - Starting and stopping the bout time.
    - Entering points, passivity, cautions shown by referee
    - Correcting incorrect entries. If possible, the time of the event should be retained.
    - The bout time is stopped automatically on expiration.
    - If not the final period is over, the break between periods is started automatically.
    - Starting and stopping injury times for each wrestler.
4. Ending the bout when the bout time is over or a victory condition is reached.
    - The recorder has to complete the final scoresheet by entering the kind of victory and classification points.
    - If needed, changes in header section can be made.
    - The final scoresheet can be exported to JSON (See [Event sourcing](#event-sourcing)).


## How will it be used?

Typically, CHAMP Protocol is used on a laptop with modern web browsers like Chrome, Firefox or Edge. CHAMP Protocol is designed as a self-contained, single-page, single-file HTML5 solution to provide maximum compatibility and ease of use. No installation or internet connection is required to use CHAMP Protocol after the initial download.

The user has the choice to either work with mouse or touch input if available or use keyboard shortcuts for faster data entry. For that, CHAMP Protocol provides an intuitive user interface with buttons for each type of event that can occur during a wrestling bout. Each button also show the keyboard shortcut for the respective event.

It should also be possible to use CHAMP Protocol on tablets or smartphones. Then the user interface can only be operated with touch input (same as mouse for laptops).

### Recording Events

| Event                 | Button       | Keyboard Shortcut | Description                                    |
|-----------------------|--------------|-------------------|------------------------------------------------|
| Start/Stop Bout Time  |⏱️ ▶️/⏸️     | Spacebar          | Starts running the stoppwatch                  |
| Red 1                 | 🟥"1"        | R + 1             | Award 1 point to Red                           |
| Red 2                 | 🟥"2"        | R + 2             | Award 2 points to Red                          |
| Red 4                 | 🟥"4"        | R + 4             | Award 4 points to Red                          |
| Blue 1                | 🟦"1"        | B + 1             | Award 1 point to Blue                          |
| Blue 2                | 🟦"2"        | B + 2             | Award 2 points to Blue                         |
| Blue 4                | 🟦"4"        | B + 4             | Award 4 points to Blue                         |
| Red Passivity         | 🟥"P"        | R + P             | Record passivity for Red                       |
| Blue Passivity        | 🟦"P"        | B + P             | Record passivity for Blue                      |
| Red Caution Blue 1    | 🟥"0" 🟦"1"  | R + 0 + 1         | Record caution for Red, 1 Point Blue           |
| Red Caution Blue 2    | 🟥"0" 🟦"2"  | R + 0 + 2         | Record caution for Red, 2 Points Blue          |
| Blue Caution Red 1    | 🟦"0" 🟥"1"  | B + 0 + 1         | Record caution for Blue, 1 Point Red           |
| Blue Caution Red 2    | 🟦"0" 🟥"2"  | B + 0 + 2         | Record caution for Blue, 2 Points Red          |
| Start/Stop Injury Red | 🟥⏱️🚑 ▶️/⏸️| R + '+'           | Start/Stop injury time without blood for Red   |
| Start/Stop Blood Red  | 🟥⏱️🩸 ▶️/⏸️| R + '*'           | Start/Stop injury time with blood for Red      |
| Start/Stop Injury Blue| 🟦⏱️🚑 ▶️/⏸️| B + '+'           | Start/Stop injury time without blood for Blue  |
| Start/Stop Blood Blue | 🟦⏱️🩸 ▶️/⏸️| B + '*'           | Start/Stop injury time with blood for Blue     |

### Displaying the Events: The Timeline

The timeline is divided into horizontal event slots and shows all recorded events in chronological order, along with the bout time at which they occurred. It provides a clear overview of the bout's progression and allows the recorder to verify the accuracy of the recorded data.

A cursor indicates the current position in the timeline where the next event will be recorded to. The cursor is represented by a frame arround the the slot.
Lets assume that the user now records the event "Blue 2" at bout time 2:32. Then the user will press the key "R" at first which leads to an empty blue square along with the bout time 2:32 in the slot surrounded with the cursor frame. Then the user presses "2" which fills the blue square with the number "2". Then the score of the previous slot will be deleted and the new calculated score is shown in the current slot. After that the cursor moves one slot to the right, indicating that the next event will be recorded in that slot.

If a period ends, the score will not be deleted. After the last slot of the period, a thick vertical line is shown to indicate the end of the period. The next slot will then represent the first event of the next period, starting with a score of 0-0 again.

**Example Timeline:**

| Slot       | Sum  |   1  |   2  |   3  |   4  |   5  |   6  |B|   7  | 8(L) | 9(N) | ...  |
|------------|------|------|------|------|------|------|------|-|------|------|------|------|
| Score Red  |   3  |      |      |      |      |      |   1  |B|      |   2  |      |      |
| Event Red  |      |   1  |      |      |   P  |   0  |      |B|   2  |      |      |      |
| Time       |      | 0:52 | 1:04 | 1:09 | 1:43 | 1:57 | 2:32 |B| 3:44 | 4:12 |      |      |
| Event Blue |      |      |   1  |   1  |      |   1  |   2  |B|      |   1  |      |      |
| Score Blue |   6  |      |      |      |      |      |   5  |B|      |   1  |      |      |

The bout is still ongoing, so the last slot (9) is reserved for the next event to be recorded (N). The second last slot (8) shows the last recorded event (L) along with the current score in the active period.

- Slot 1: Red scores 1 point at 0:52
- Slot 2: Blue scores 1 point at 1:04
- Slot 3: Blue scores 1 point at 1:09
- Slot 4: Red receives passivity at 1:43
- Slot 5: Blue gets 1 point due to Red wrestler's caution at 1:57
- Slot 6: Blue scores 2 points at 2:32. This is the last event recorded in the first period. The score of the first period 1-5 is shown in this slot. The thick vertical line (B) indicates the end of the first period.
- Slot 7: Red scores 2 points at 3:44.
- Slot 8: Blue scores 1 point at 4:12. This is the last event recorded at the moment (L). For this, the score of the second period 2-1 is shown in this slot.
- Slot 9: Next event to be recorded (N).

### Making corrections

If an incorrect event was recorded, the user can move the cursor to the respective slot using the left and right arrow keys. Once the cursor is on the desired slot, the user can to several corrections:
- Key "R" changes the event to a Red event
- Key "B" changes the event to a Blue event
- Key "1", "2", "4, "P" changes the event type respectively
- With cautions:
    - Key "R" changes the event to caution for Red the points awarded to Blue
    - Key "B" changes the event to caution for Blue the points awarded to Red
    - Key "1" or "2" after that changes the points awarded to the opponent
- Deleting the event with "Delete" key
- Left and Right arrow keys to move the cursor to previous respective next slot
- Enter key to confirm the correction and move the cursor to the end of the timeline ready for next event entry.
- Escape key to cancel the current correction and move the cursor to the end of the timeline ready for next event entry.
- The backspace key will have the same effect as the left arrow key.

### Completing the Scoresheet

When the bout is over, either because the bout time has expired or a victory condition has been reached, the recorder has to complete the final scoresheet. This involves entering the type of victory (e.g., fall, technical superiority, points) and assigning classification points to each wrestler based on the bout outcome.

## Event sourcing

CHAMP Protocol uses an event-sourcing approach to record and manage bout events. Each event is logged with its type, the wrestler involved, the absolute timestamp and the bout time at which it occurred, and any additional relevant information (e.g., points awarded, cautions). The first event is "open new scoresheet", the last event is "scoresheet completed". Even all corrections shall be logged. This structured approach allows for easy tracking of bout progression and facilitates accurate reconstruction of the bout history.

See [Exported Scoresheet Format](#exported-scoresheet-format) for an example of the exported JSON file containing all recorded events.

## Layout and Design considerations

- The user interface should be clean and uncluttered, focusing on essential elements for recording wrestling bout events.
- Buttons for recording events should be large and easily clickable/tappable, with clear labels and keyboard shortcuts.
- For mouse input the buttons should be arranged more centrally on the screen for easy access.
- For touch input the buttons should be arranged more at the left and right edges of the screen for easy thumb reach.
- The timeline should be prominently displayed, providing a clear overview of recorded events and bout progression.
- The design should be responsive, ensuring usability across various devices, including laptops, tablets, and smartphones.

Layout suggestion:
```
+-----------------------------------------------------+
|                    Header Section                   |
+-----------------------------------------------------+
|  Red Wrestler: Name/Team, Score, Injury times       |    
| Blue Wrestler: Name/Team, Score, Injury times       |
+-----------------------------------------------------+
|                                                     |
|                   Timeline Section                  |
|                                                     |
+-----------------------------------------------------+
|                                                     |
|                 Event Buttons Section               |
|            Bout time, Bout release/complete         |
+-----------------------------------------------------+
```

Colors:
- Red wrestler: #780000, #C1121F
- Blue wrestler: #003049, #0077B6
- Background: #FDF0D5
- Deactivated: nuanced gray tones with touch to red/blue
- Text: dark gray / black


## Data Formats

### Ruleset Format

CHAMP Protocol supports multiple wrestling rulesets, which define the specific regulations and scoring criteria for different wrestling styles (e.g., Freestyle, Greco-Roman). The recorder must select the appropriate ruleset when creating a new scoresheet to ensure that the bout is recorded accurately according to the relevant rules.

One ruleset shall be contained in CHAMP Protocol HTML file. Additional rulesets can be loaded from external JSON files if needed.

Example of a ruleset JSON file:
```json
{
  "name": "Active 2026",
  "periodsInSeconds": [180, 180],
  "boutTimeCountingDirection": "Down",
  "boutTimeDisplay": "Bout|Period",
  "breakSeconds": 30,
  "breakCountingDirection": "Down",
  "injuryTimeWithoutBloodSeconds": 120,
  "injuryTimeWithBloodSeconds": 240,
  "injuryTimeCountingDirection": "Up",
  "points": [1, 2, 4, 5],
  "maxPointDifferenceForVSU": 15,
  "Freestyle": {
    "activityTimeSeconds": 30,
    "activityCountingDirection": "Down",
    "activityTimeWithPassivityCount": 2,
  }
  "victoryConditions": [
    {"Description": "Victory by Fall", "Code": "VFA", "ClassificationPointsRed": 5, "ClassificationPointsBlue": 0},
    {"Description": "Victory by Injury", "Code": "VIN", "ClassificationPointsRed": 5, "ClassificationPointsBlue": 0},
    {"Description": "Victory by 3 Cautions", "Code": "VCA", "ClassificationPointsRed": 5, "ClassificationPointsBlue": 0},
    {"Description": "Victory by Technical Superiority - no opponent points", "Code": "VSU", "ClassificationPointsRed": 4, "ClassificationPointsBlue": 0},
    {"Description": "Victory by Technical Superiority - with opponent points", "Code": "VSU1", "ClassificationPointsRed": 4, "ClassificationPointsBlue": 1},
    {"Description": "Victory by Points - no opponent points", "Code": "VPO", "ClassificationPointsRed": 3, "ClassificationPointsBlue": 0},
    {"Description": "Victory by Points - with opponent points", "Code": "VPO1", "ClassificationPointsRed": 3, "ClassificationPointsBlue": 1},
    {"Description": "Victory by Forfeit", "Code": "VFO", "ClassificationPointsRed": 5, "ClassificationPointsBlue": 0},
    {"Description": "Victory by Disqualification", "Code": "DSQ", "ClassificationPointsRed": 5, "ClassificationPointsBlue": 0},
    {"Description": "Victory by Double Disqualification", "Code": "2DSQ", "ClassificationPointsRed": 0, "ClassificationPointsBlue": 0},
  ]
}
```

### Exported Scoresheet Format

The exported JSON file consists of two parts:
- First part contains the data of the shown in the scoresheet: header section, wrestler data and the timeline.
- Second part contains all recorded events in chronological order, providing a comprehensive record of the bout that can be used for analysis, review, or archival purposes.

Example of an exported scoresheet JSON file:
```json
{
  "scoresheet": {
    "ruleset": "Active 2026",
    "wrestlingStyle": "Freestyle",
    "header": "'Friendly Bout', 'U17', '65 kg'",
    "redWrestler": "['John Doe', 'Team A']",
    "blueWrestler": "['Max Mustermann', 'Team B']",
    "timeline": [
      {"boutTime": "0:52", "event": "R1"},
      {"boutTime": "1:04", "event": "B1"},
      ...
    ],
    "boutTime": "6:00",
    "winner": "Red",
    "classification": {
        "type": "VPO1",
        "red": 3,
        "blue": 1
    },
  },
  "events": [
    {"seq": 0, "timestamp": "2024-06-01T10:00:00Z", "eventType": "OpenScoresheet"},
    {"seq": 1, "timestamp": "2024-06-01T...", "boutTime": "0:00", "eventType": "BoutTimeStarted"},
    {"seq": 2, "timestamp": "2024-06-01T...", "boutTime": "0:17", "eventType": "BoutTimeStopped"},
    {"seq": 3, "timestamp": "2024-06-01T...", "boutTime": "0:17", "eventType": "BoutTimeStarted"},
    {"seq": 4, "timestamp": "2024-06-01T...", "boutTime": "0:52", "eventType": "R1"},
    {"seq": 5, "timestamp": "2024-06-01T...", "boutTime": "1:04", "eventType": "B1"},
    ...
    {"seq": 5, "timestamp": "2024-06-01T...", "eventType": "EventChanged", "details": {"originalSeq": 4, "newEventType": "R2"}},
    ...
    {"seq": N, "timestamp": "2024-06-01T...", "eventType": "ScoresheetCompleted", "details": {...}}
  ]
}
```

