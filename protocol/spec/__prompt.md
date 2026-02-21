Please make suggestion for a json ruleset format with following properties:
- Two periods of 3 minutes each, counting down, with a 30 second break in between
- Injury time of 2 minutes without blood and 4 minutes with blood per wrestler, counting up.
- 15 points difference for technical superiority
- Allowed bout events:
    - "1": 1 point awarded to a wrestler, e.g. "1R" or "1B"
    - "2": 2 points awarded to a wrestler, e.g. "2R" or "2B"
    - "4": 4 points awarded to a wrestler, e.g. "4R" or "4B"
    - "5": 5 points awarded to a wrestler, e.g. "5R" or "5B"
    - "P": Passivity warning for a wrestler, e.g. "PR" or "PB"
    - "01": Caution for a wrestler, 1 point for opponent, e.g. "0R1B", "0B1R"
    - "02": Caution for a wrestler, 2 points for opponent, e.g. "0R2B", "0B2R"
 - Victory conditions (for a german team bout):
    |Code (en)|Type (en)|Code (de)|Type (de)|Classification points|
    |---|---|---|---|---|
    |VFA|Victory by Fall|SS|Schultersieg|4:0|
    |VSU|Victory by Superiority|TÜ|Technische Überlegenheit|4:0|
    |VPO|Victory by Points|PS|Punktsieg|3:0, when difference is 8 to 14 points|
    |VPO|Victory by Points|PS|Punktsieg|2:0, when difference is 3 to 7 points|
    |VPO|Victory by Points|PS|Punktsieg|1:0, when difference is 1 to 2 points or equal points|
    |VIN|Victory by Injury|AS|Aufgabesieg|4:0|
    |VCA|Victory by 3 Cautions|DV|Disqualifikation durch 3 Verwarnungen|4:0|
    |DSQ|Disqualification due to unfair behavior|DSQ|Disqualifikation durch unfaires Verhalten|4:0|
    |DSQ2|Disqualification of both wrestlers due to unfair behavior|DSQ2|Beide Ringer disqualifiziert wegen unfairem Verhalten|0:0|
    ||Win by default|KL|Kampfloser Sieg|4:0|
    ||Overweight|ÜG|Übergewicht|4:0|
- Special Rule in freestyle:
    - Activity time: 30 Second for each "P" when number of "P"s of a wrestler is more than 1.