# What is CHAMP Protocol?

## Purpose

CHAMP Protocol is a tool that supports the recorder of a wrestling bout with recording all events that happens during a bout.

## How will it be used?

1. The recorder opens a new scoresheet.
    - He has to select a ruleset and a **wrestling style**.
    - Optionally he can fill in the header section, containing
        - a description like reason for the bout like tournament, team bout or friendly bout as well as age or weight categories
        - description for each wrestler, like its name, team, nation.
2. The recorder releases the **scoresheet**.
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
    - The final scoresheet can be exported to JSON.

## Who will use it?

The primary users of CHAMP Protocol are wrestling specialists, who have a deep understanding of wrestling rules and bout procedures like referees, wrestlers or other deeply interested persons. However, some users may not be very knowledgeable about wrestling, because they want to get into the subject.
The users of CHAMP protocol may not be very familiar with digital tools, so CHAMP Protocol is designed to be user-friendly and intuitive.