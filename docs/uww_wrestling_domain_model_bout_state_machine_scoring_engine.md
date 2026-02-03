# UWW Wrestling – Domain Model, Bout State Machine & Scoring & Penalty Engine

This document defines the **core domain model**, the **bout state machine**, and the **scoring & penalty engine** strictly aligned with **United World Wrestling (UWW) rules**.  
It is designed as a foundation for software implementation (DDD-oriented, rule-driven).

---

## 1. Domain Model (Conceptual)

### 1.1 Core Aggregates

#### Bout (Aggregate Root)
Represents a single wrestling contest.

**Attributes:**
- boutId
- style (Freestyle | GrecoRoman)
- ageCategory
- weightCategory
- mat
- redWrestler
- blueWrestler
- refereeTeam
- periods
- currentState
- score
- penalties
- startTime / endTime
- victoryType

**Responsibilities:**
- Control bout lifecycle
- Validate rule-compliant transitions
- Determine victory and classification points

---

#### Wrestler

**Attributes:**
- wrestlerId
- name
- nationality
- licenseStatus
- ageCategory
- weightCategory
- cornerColor (Red | Blue)

---

#### Period

**Attributes:**
- periodNumber (1 | 2)
- duration
- scoreSnapshot
- activityTime

---

#### Mat

**Attributes:**
- matId
- centralCircle
- wrestlingArea
- passivityZone
- protectionArea

---

#### RefereeingTeam

**Attributes:**
- referee
- judge
- matChairman

---

#### Score

**Attributes:**
- redPoints
- bluePoints
- technicalPointsRed
- technicalPointsBlue

---

#### Penalty

**Attributes:**
- type (Caution | Passivity | Fleeing | IllegalHold)
- wrestler
- timestamp
- period

---

### 1.2 Supporting Value Objects

- ActivityPeriod
- ClassificationPoints
- VictoryCondition
- MedicalDecision

---

## 2. Bout State Machine

### 2.1 High-Level States

```
Scheduled
  ↓
CalledToMat
  ↓
Ready
  ↓
InPeriod1
  ↓
Break
  ↓
InPeriod2
  ↓
BoutEnded
```

---

### 2.2 Detailed States and Transitions

#### Scheduled
- Bout exists but has not started

**Transition:** CallToMat

---

#### CalledToMat
- Wrestlers are called (3 calls possible)

**Transitions:**
- Ready (both present)
- Forfeit (no-show)

---

#### Ready
- Wrestlers inspected, positioned in corners

**Transition:** StartBout

---

#### InPeriod (1 or 2)

**Possible Events:**
- ScoringAction
- PassivityDetected
- ActivityPeriodStarted
- Injury
- IllegalHold
- ChallengeRequested
- PeriodEnd

**Transitions:**
- Break (after Period 1)
- BoutEnded

---

#### Break
- 30-second rest

**Transition:** StartPeriod2

---

#### BoutEnded

**End Reasons:**
- Fall
- TechnicalSuperiority
- VictoryByPoints
- InjuryVictory
- Forfeit
- Disqualification

---

## 3. Scoring & Penalty Engine

### 3.1 Scoring Principles

- All scoring actions produce **ScoringEvents**
- Events are validated against:
  - style
  - current state
  - mat zone
  - opponent position

---

### 3.2 Scoring Events

#### Takedown / Action Points

**Inputs:**
- attacker
- defender
- actionType
- amplitude
- dangerPosition

**Rules:**
- Points awarded according to UWW values
- Evaluated until illegal moment if action becomes illegal

---

#### Danger Position

**Rule:**
- Defensive wrestler exposed with back toward mat
- Triggers higher point values

---

### 3.3 Fall Detection

**Conditions:**
- Both shoulders controlled
- Inside valid mat zone
- Confirmed by mat chairman

**Effect:**
- Immediate transition to BoutEnded
- VictoryType = Fall

---

### 3.4 Technical Superiority

**Rule:**
- Greco-Roman: 8-point difference
- Freestyle: 10-point difference

**Effect:**
- Immediate bout termination

---

### 3.5 Passivity & Activity Time Engine

**Trigger Conditions:**
- Blocking
- Avoiding contact
- Lack of action

**Process:**
1. Verbal warning (style/age dependent)
2. Designate passive wrestler
3. Start 30-second Activity Period
4. If no score by passive wrestler → opponent scores

---

### 3.6 Penalty Handling

#### Caution
- Assigned for:
  - Illegal hold
  - Fleeing the mat
  - Passivity violations

**Effect:**
- May award points to opponent
- Tracked cumulatively

---

#### Disqualification

**Triggers:**
- Three cautions
- Brutality
- Serious rule violation

**Effect:**
- Immediate bout end
- Wrestler ranked DSQ

---

### 3.7 Injury & Medical Engine

**Rules:**
- UWW doctor may stop bout
- Bleeding time limited to 4 minutes total

**Outcomes:**
- Resume bout
- Injury Victory

---

### 3.8 Classification Points Calculation

**Based On:**
- VictoryType
- Final score

**Examples:**
- Fall: 5–0
- Technical Superiority (no points conceded): 4–0
- Victory by Points: 3–1 or 3–0

---

## 4. Implementation Notes

- Domain events are immutable
- All decisions are traceable
- Video challenges do not alter state retrospectively

---

**This model is intentionally rule-centric and deterministic, suitable for simulation, scoring automation, and competition management systems.**

