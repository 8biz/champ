import { test, expect } from "@playwright/test";
import { BASE_URL } from "./helpers.js";

// ── Pure Namespace Spot-Checks ──────────────────────────────────────────────

test.describe("CHAMP – Pure Namespaces", () => {

  // ── Fmt ─────────────────────────────────────────────────────────────────

  test.describe("Fmt", () => {
    test("Fmt.time100ms formats 100ms units as M:SS.f", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.Fmt.time100ms(1801));
      // 1801 * 100ms = 180100ms = 180.1s = 3:00.1
      expect(result).toBe("3:00.1");
    });

    test("Fmt.time100ms zero-pads seconds", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.Fmt.time100ms(10));
      // 10 * 100ms = 1000ms = 1s = 0:01.0
      expect(result).toBe("0:01.0");
    });

    test("Fmt.mmss formats 100ms units as M:SS with no fraction", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.Fmt.mmss(1800));
      // 1800 * 100ms = 180000ms = 180s = 3:00
      expect(result).toBe("3:00");
    });

    test("Fmt.mmss zero-pads seconds", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.Fmt.mmss(50));
      // 50 * 100ms = 5s = 0:05
      expect(result).toBe("0:05");
    });
  });

  // ── EventType ───────────────────────────────────────────────────────────

  test.describe("EventType", () => {
    test("EventType.parsePoint returns points and side for '2R'", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.EventType.parsePoint("2R"));
      expect(result).toEqual({ points: 2, side: "R" });
    });

    test("EventType.parsePoint returns null for non-point event 'PR'", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.EventType.parsePoint("PR"));
      expect(result).toBeNull();
    });

    test("EventType.parsePassivity returns side for 'PB'", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.EventType.parsePassivity("PB"));
      expect(result).toEqual({ side: "B" });
    });

    test("EventType.parsePassivity returns null for '1R'", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.EventType.parsePassivity("1R"));
      expect(result).toBeNull();
    });

    test("EventType.parseCaution returns fields for '0R1B'", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.EventType.parseCaution("0R1B"));
      expect(result).toEqual({ cautionedSide: "R", points: 1, recipientSide: "B" });
    });

    test("EventType.parseCaution returns null for '2R'", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.EventType.parseCaution("2R"));
      expect(result).toBeNull();
    });

    test("EventType.isRawBout returns true for a bout event", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.EventType.isRawBout({ eventType: "2R", boutTime100ms: 100 })
      );
      expect(result).toBe(true);
    });

    test("EventType.isRawBout returns false for a T_ event", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.EventType.isRawBout({ eventType: "T_Started", boutTime100ms: 0 })
      );
      expect(result).toBe(false);
    });

    test("EventType.colorClass returns 'red' for '2R'", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.EventType.colorClass("2R"));
      expect(result).toBe("red");
    });

    test("EventType.colorClass returns 'blue' for '0B2R'", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.EventType.colorClass("0B2R"));
      expect(result).toBe("blue");
    });

    test("EventType.colorClass returns 'next' for unknown type", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.EventType.colorClass("PeriodEnd"));
      expect(result).toBe("next");
    });
  });

  // ── Score ───────────────────────────────────────────────────────────────

  test.describe("Score", () => {
    test("Score.calculate sums technical points and cautions correctly", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.Score.calculate([
          { eventType: "2R", boutTime100ms: 100 },
          { eventType: "4B", boutTime100ms: 200 },
          { eventType: "0R1B", boutTime100ms: 300 }  // caution: red cautioned, blue gets 1pt
        ])
      );
      expect(result.red).toBe(2);
      expect(result.blue).toBe(5); // 4 + 1 from caution
    });

    test("Score.calculate returns zero scores for empty events", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.Score.calculate([]));
      expect(result).toEqual({ red: 0, blue: 0 });
    });

    test("Score.statistics counts passivity events", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.Score.statistics([
          { eventType: "PR", boutTime100ms: 100 },
          { eventType: "PB", boutTime100ms: 200 },
          { eventType: "PR", boutTime100ms: 300 }
        ])
      );
      expect(result.red.passivity).toBe(2);
      expect(result.blue.passivity).toBe(1);
    });

    test("Score.statistics counts caution events per side", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.Score.statistics([
          { eventType: "0R1B", boutTime100ms: 100 },
          { eventType: "0B2R", boutTime100ms: 200 }
        ])
      );
      expect(result.red.cautions).toBe(1);
      expect(result.blue.cautions).toBe(1);
    });

    test("Score.statistics includes injury times when injuryTimers snapshot is provided", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.Score.statistics([], {
          IR: { time100ms: 300 },
          IB: { time100ms: 150 },
          BR: { time100ms: 0 },
          BB: { time100ms: 50 }
        })
      );
      expect(result.red.injuryTime100ms).toBe(300);
      expect(result.blue.injuryTime100ms).toBe(150);
      expect(result.red.bloodTime100ms).toBe(0);
      expect(result.blue.bloodTime100ms).toBe(50);
    });

    test("Score.statistics returns zero injury times when no injuryTimers provided", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.Score.statistics([{ eventType: "2R", boutTime100ms: 100 }])
      );
      expect(result.red.injuryTime100ms).toBe(0);
      expect(result.blue.injuryTime100ms).toBe(0);
    });
  });

  // ── Ruleset ─────────────────────────────────────────────────────────────

  test.describe("Ruleset", () => {
    test("Ruleset.load returns the embedded ruleset", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.Ruleset.load());
      expect(result).not.toBeNull();
      expect(result.metadata.name).toBeTruthy();
    });

    test("Ruleset.validate passes for the embedded ruleset", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.Ruleset.validate(window.Ruleset.load()));
      expect(result.valid).toBe(true);
    });

    test("Ruleset.evaluateCondition returns true when all conditions met", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.Ruleset.evaluateCondition({ scoreDifference: { gte: 15 } }, { scoreDifference: 15 })
      );
      expect(result).toBe(true);
    });

    test("Ruleset.evaluateCondition returns false when condition not met", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.Ruleset.evaluateCondition({ scoreDifference: { gte: 15 } }, { scoreDifference: 10 })
      );
      expect(result).toBe(false);
    });

    test("Ruleset.resolveClassificationPoints resolves constant values", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.Ruleset.resolveClassificationPoints({ winner: 4, loser: 0 }, {})
      );
      expect(result).toEqual({ winner: 4, loser: 0 });
    });

    test("Ruleset.getLastAwardSide returns side of last scoring event", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.Ruleset.getLastAwardSide([
          { eventType: "2R", boutTime100ms: 100 },
          { eventType: "1B", boutTime100ms: 200 }
        ])
      );
      expect(result).toBe("blue");
    });

    test("Ruleset.getLastAwardSide returns null for empty events", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.Ruleset.getLastAwardSide([]));
      expect(result).toBeNull();
    });

    test("Ruleset.findTiebreakWinner picks side with more 5-awards", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.Ruleset.findTiebreakWinner([
          { eventType: "5R", boutTime100ms: 100 },
          { eventType: "4B", boutTime100ms: 200 },
          { eventType: "4B", boutTime100ms: 300 }
          // scores tied 5-8, but red has one 5-award, blue has none → red wins tiebreak
        ])
      );
      expect(result).toBe("red");
    });

    test("Ruleset.getBoutContext computes scoreDifference from events", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.Ruleset.getBoutContext(undefined, [
          { eventType: "4R", boutTime100ms: 100 },
          { eventType: "1B", boutTime100ms: 200 }
        ])
      );
      expect(result.scoreRed).toBe(4);
      expect(result.scoreBlue).toBe(1);
      expect(result.scoreDifference).toBe(3);
    });

    // Verify backward-compat alias still works
    test("window.rulesetHelper is still accessible and functional", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.rulesetHelper.resolveClassificationPoints({ winner: 3, loser: 1 }, {})
      );
      expect(result).toEqual({ winner: 3, loser: 1 });
    });
  });

  // ── Projection ──────────────────────────────────────────────────────────

  test.describe("Projection", () => {
    const noSwap = { inSwapMode: false, swapOriginIndex: null, cursorIndex: null };

    test("Projection.compute returns raw bout events when no corrections", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate((swapState) => {
        const events = [
          { seq: 1, eventType: "2R", boutTime100ms: 100 },
          { seq: 2, eventType: "1B", boutTime100ms: 200 }
        ];
        return window.Projection.compute(events, [], swapState, false);
      }, noSwap);
      expect(result).toHaveLength(2);
      expect(result[0].eventType).toBe("2R");
      expect(result[1].eventType).toBe("1B");
    });

    test("Projection.compute applies committed EventModified in effective mode", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate((swapState) => {
        const events = [
          { seq: 1, eventType: "2R", boutTime100ms: 100 },
          { seq: 10, eventType: "EventModified", refSeq: 1, newEventType: "2B" }
        ];
        return window.Projection.compute(events, [], swapState, false);
      }, noSwap);
      expect(result).toHaveLength(1);
      expect(result[0].eventType).toBe("2B");
    });

    test("Projection.compute removes committed EventDeleted events in effective mode", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate((swapState) => {
        const events = [
          { seq: 1, eventType: "2R", boutTime100ms: 100 },
          { seq: 2, eventType: "1B", boutTime100ms: 200 },
          { seq: 10, eventType: "EventDeleted", refSeq: 1 }
        ];
        return window.Projection.compute(events, [], swapState, false);
      }, noSwap);
      expect(result).toHaveLength(1);
      expect(result[0].eventType).toBe("1B");
    });

    test("Projection.compute annotates pending-deleted events in annotate mode", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate((swapState) => {
        const events = [
          { seq: 1, eventType: "2R", boutTime100ms: 100 }
        ];
        const correctionBuffer = [{ deleted: true, refSeq: 1 }];
        return window.Projection.compute(events, correctionBuffer, swapState, true);
      }, noSwap);
      expect(result).toHaveLength(1);
      expect(result[0].pendingDeleted).toBe(true);
      expect(result[0].eventType).toBe("2R");
    });

    test("Projection.compute applies pending EventModified in effective mode", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate((swapState) => {
        const events = [
          { seq: 1, eventType: "4R", boutTime100ms: 100 }
        ];
        const correctionBuffer = [{ refSeq: 1, newEventType: "2R" }];
        return window.Projection.compute(events, correctionBuffer, swapState, false);
      }, noSwap);
      expect(result).toHaveLength(1);
      expect(result[0].eventType).toBe("2R");
    });

    test("Projection.applyEventTypeSwap exchanges types between two entries", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => {
        const arr = [
          { seq: 1, eventType: "2R", boutTime100ms: 100 },
          { seq: 2, eventType: "1B", boutTime100ms: 200 }
        ];
        window.Projection.applyEventTypeSwap(arr, 1, 2);
        return arr;
      });
      expect(result[0].eventType).toBe("1B");
      expect(result[1].eventType).toBe("2R");
    });

    test("Projection.applyEventTypeSwap sets originalEventType when annotate=true", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => {
        const arr = [
          { seq: 1, eventType: "2R", boutTime100ms: 100 },
          { seq: 2, eventType: "1B", boutTime100ms: 200 }
        ];
        window.Projection.applyEventTypeSwap(arr, 1, 2, true);
        return arr;
      });
      expect(result[0].originalEventType).toBe("2R");
      expect(result[1].originalEventType).toBe("1B");
    });

    test("Projection.compute parity: matches effective events used by Score.calculate", async ({ page }) => {
      await page.goto(BASE_URL);
      // Build a scenario with a committed modify and verify Projection.compute
      // produces the same result as the live getEffectiveBoutEvents path.
      const result = await page.evaluate((swapState) => {
        const events = [
          { seq: 1, eventType: "2R", boutTime100ms: 100 },
          { seq: 2, eventType: "4R", boutTime100ms: 200 },
          { seq: 10, eventType: "EventModified", refSeq: 2, newEventType: "4B" }
        ];
        const projected = window.Projection.compute(events, [], swapState, false);
        const scores = window.Score.calculate(projected);
        return scores;
      }, noSwap);
      expect(result.red).toBe(2);   // only seq=1 (2R) counts for red
      expect(result.blue).toBe(4);  // seq=2 was modified to 4B
    });
  });

  // ── ExportBuilder ────────────────────────────────────────────────────────

  test.describe("ExportBuilder", () => {
    test("ExportBuilder.parseInfo parses key:value pairs", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.ExportBuilder.parseInfo("name:Müller; club:TSV")
      );
      expect(result.name).toBe("Müller");
      expect(result.club).toBe("TSV");
    });

    test("ExportBuilder.parseInfo anonymises $-prefixed keys", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.ExportBuilder.parseInfo("$hidden:SecretValue")
      );
      expect(result.anonym1).toBe("SecretValue");
      expect(result["$hidden"]).toBeUndefined();
    });

    test("ExportBuilder.parseInfo omits $$-prefixed hidden pairs", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.ExportBuilder.parseInfo("$$secret:ignored; name:Visible")
      );
      expect(result.name).toBe("Visible");
      expect(result["$$secret"]).toBeUndefined();
    });

    test("ExportBuilder.parseInfo returns empty object for empty string", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() =>
        window.ExportBuilder.parseInfo("")
      );
      expect(result).toEqual({});
    });

    test("ExportBuilder.getSystemMetadata returns expected fields", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => window.ExportBuilder.getSystemMetadata());
      expect(result).toHaveProperty("userAgent");
      expect(result).toHaveProperty("timestamp");
      expect(result.viewport).toHaveProperty("width");
      expect(result.viewport).toHaveProperty("height");
      expect(result).toHaveProperty("timezone");
    });

    test("ExportBuilder.build returns valid export schema structure", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => {
        const ctx = {
          effectiveEvents: [{ seq: 1, eventType: "2R", boutTime100ms: 100 }],
          scores: { red: 2, blue: 0 },
          statistics: { corrections: 0, red: {}, blue: {} },
          boutInfo: "Test Bout",
          style: "Freestyle",
          rulesetName: "Default",
          ruleset: null,
          redInfo: "name:Red",
          blueInfo: "name:Blue",
          events: [{ seq: 1, eventType: "2R", boutTime100ms: 100 }],
          completed: false,
          winner: null,
          victoryType: null,
          victoryDescription: null,
          classificationPoints: null,
          createdAt: "2025-01-01T10:00:00.000Z",
          completedAt: null,
        };
        return window.ExportBuilder.build(ctx);
      });
      expect(result.$schema).toBe("./export-v1.schema.json");
      expect(result.exportVersion).toBe("1.0");
      expect(result.bout.header.info).toBe("Test Bout");
      expect(result.bout.summary.scores.red).toBe(2);
      expect(result.bout.summary.timeline).toHaveLength(1);
      expect(result.bout.summary.timeline[0].eventType).toBe("2R");
    });

    test("ExportBuilder.build excludes virtual pending events from timeline", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => {
        const ctx = {
          // Virtual events have string seqs (pi- / tm- prefixes)
          effectiveEvents: [
            { seq: 1, eventType: "2R", boutTime100ms: 100 },
            { seq: "pi-2", eventType: "1B", boutTime100ms: 200 }
          ],
          scores: { red: 2, blue: 0 },
          statistics: { corrections: 0, red: {}, blue: {} },
          boutInfo: "", style: "Freestyle", rulesetName: "Default",
          ruleset: null, redInfo: "", blueInfo: "",
          events: [],
          completed: false, winner: null, victoryType: null,
          victoryDescription: null, classificationPoints: null,
          createdAt: null, completedAt: null,
        };
        return window.ExportBuilder.build(ctx);
      });
      expect(result.bout.summary.timeline).toHaveLength(1);
      expect(result.bout.summary.timeline[0].seq).toBe(1);
    });

    test("ExportBuilder.build computes winner from scores when completed and no explicit winner", async ({ page }) => {
      await page.goto(BASE_URL);
      const result = await page.evaluate(() => {
        const ctx = {
          effectiveEvents: [],
          scores: { red: 5, blue: 3 },
          statistics: { corrections: 0, red: {}, blue: {} },
          boutInfo: "", style: "Freestyle", rulesetName: "Default",
          ruleset: null, redInfo: "", blueInfo: "",
          events: [],
          completed: true, winner: null, victoryType: null,
          victoryDescription: null, classificationPoints: null,
          createdAt: null, completedAt: null,
        };
        return window.ExportBuilder.build(ctx);
      });
      expect(result.bout.summary.winner).toBe("red");
    });
  });
});
