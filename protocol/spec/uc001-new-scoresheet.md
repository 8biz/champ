# Use Case 002 - Short bout

Summary: User opens protocol.html with web browser and gets a ready-to-start scoresheet

## Preconditions

No.

## Postconditions

Website shows:
- Enabled Elements:
    - bout info: "Freundschaftskampf"
    - wrestler red name: "Rot"
    - wrestler blue name: "Blau"
    - Dropdown for wrestling style has entries "Freistil" (selected) and "Griech.-röm.".
    - Dropdown for ruleset shows only "beiliegendes Regelwerk"
    - Release-Complete-Button shows "Freigeben [F4]".
- All other buttons are disabled.
    - bout time shows `periodTimesInSeconds` from json ruleset embedded to protocol.html
- The time line has no entry.


## Main scenario

1. User opens protocol.html with web browser.
2. Website opens.

