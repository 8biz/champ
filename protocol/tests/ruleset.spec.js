import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet, recordEventAtTime } from "./helpers.js";

// ── Ruleset & Victory Types ─────────────────────────────────────────────────

test.describe("CHAMP Protocol - Ruleset & Victory Types", () => {
  test("Victory types dropdown has unique type entries", async ({ page }) => {
    await page.goto(BASE_URL);

    const types = await page.evaluate(() => {
      const ruleset = window.rulesetHelper.load();
      return ruleset.victoryTypes.map(vt => vt.type);
    });
    expect(new Set(types).size).toBe(types.length);
  });

  test("classificationPoints is an object with winner and looser", async ({ page }) => {
    await page.goto(BASE_URL);

    const allValid = await page.evaluate(() => {
      const ruleset = window.rulesetHelper.load();
      return ruleset.victoryTypes.every(vt => {
        const cp = vt.classificationPoints;
        return cp && typeof cp === 'object' && !Array.isArray(cp) &&
               cp.winner !== undefined && cp.looser !== undefined;
      });
    });
    expect(allValid).toBe(true);
  });

  test("resolveClassificationPoints returns correct points for constant values", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      return window.rulesetHelper.resolveClassificationPoints({ winner: 4, looser: 0 }, {});
    });
    expect(result.winner).toBe(4);
    expect(result.looser).toBe(0);
  });

  test("resolveClassificationPoints evaluates conditional winner points (score diff 10 → 3pts)", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      const ruleset = window.rulesetHelper.load();
      const ps = ruleset.victoryTypes.find(vt => vt.type === 'PS');
      return window.rulesetHelper.resolveClassificationPoints(ps.classificationPoints, { scoreDifference: 10 });
    });
    expect(result.winner).toBe(3);
    expect(result.looser).toBe(0);
  });

  test("resolveClassificationPoints evaluates conditional winner points (score diff 5 → 2pts)", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      const ruleset = window.rulesetHelper.load();
      const ps = ruleset.victoryTypes.find(vt => vt.type === 'PS');
      return window.rulesetHelper.resolveClassificationPoints(ps.classificationPoints, { scoreDifference: 5 });
    });
    expect(result.winner).toBe(2);
    expect(result.looser).toBe(0);
  });

  test("resolveClassificationPoints evaluates conditional winner points (score diff 1 → 1pt)", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      const ruleset = window.rulesetHelper.load();
      const ps = ruleset.victoryTypes.find(vt => vt.type === 'PS');
      return window.rulesetHelper.resolveClassificationPoints(ps.classificationPoints, { scoreDifference: 1 });
    });
    expect(result.winner).toBe(1);
    expect(result.looser).toBe(0);
  });

  test("Completion form auto-fills conditional points based on score difference", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Record 4R + 4R + 2R = 10 for Red
    await recordEventAtTime(page, "2:50", ["4", "R"]);
    await recordEventAtTime(page, "2:40", ["4", "R"]);
    await recordEventAtTime(page, "2:30", ["2", "R"]);

    await page.keyboard.press("F4");
    await expect(page.locator("#completion-form")).toBeVisible();

    await page.selectOption("#compl-winner", "red");
    await page.selectOption("#compl-victory-type", "PS");

    // scoreDifference = 10 (gte 8, lte 14) → winner gets 3 pts
    await expect(page.locator("#compl-points-red")).toHaveValue("3");
    await expect(page.locator("#compl-points-blue")).toHaveValue("0");
  });

  test("Blue winner: form shows blue getting winner pts, export stores [winner,loser]", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Record 4B + 4B + 2B = 10 for Blue
    await recordEventAtTime(page, "2:50", ["4", "B"]);
    await recordEventAtTime(page, "2:40", ["4", "B"]);
    await recordEventAtTime(page, "2:30", ["2", "B"]);
    await expect(page.locator("#score-blue")).toHaveText("10");

    await page.keyboard.press("F4");
    await page.selectOption("#compl-winner", "blue");
    await page.selectOption("#compl-victory-type", "PS");

    await expect(page.locator("#compl-points-blue")).toHaveValue("3");
    await expect(page.locator("#compl-points-red")).toHaveValue("0");

    await page.keyboard.press("F4");
    const exportData = await page.evaluate(() => window.exportHelper.generate());
    const cp = exportData.bout.summary.victory.classificationPoints;
    expect(cp[0]).toBe(3); // winner (blue)
    expect(cp[1]).toBe(0); // loser (red)
  });

  test("Ruleset validates that type is unique", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      return window.rulesetHelper.validate({
        metadata: { name: "test", description: "test", languages: ["de"], author: "test" },
        periodTimesInSeconds: [180],
        periodTimeCountingDirection: "Down",
        periodBreakTimeInSeconds: 30,
        injuryTimeWithoutBloodInSeconds: 120,
        injuryTimeWithBloodInSeconds: 240,
        injuryTimeCountingDirection: "Up",
        victoryTypes: [
          { type: "PS", description: "A", classificationPoints: { winner: 3, looser: 0 } },
          { type: "PS", description: "B", classificationPoints: { winner: 1, looser: 0 } }
        ]
      });
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('not unique'))).toBe(true);
  });

  test("Ruleset validates that classificationPoints is object not array", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      return window.rulesetHelper.validate({
        metadata: { name: "test", description: "test", languages: ["de"], author: "test" },
        periodTimesInSeconds: [180],
        periodTimeCountingDirection: "Down",
        periodBreakTimeInSeconds: 30,
        injuryTimeWithoutBloodInSeconds: 120,
        injuryTimeWithBloodInSeconds: 240,
        injuryTimeCountingDirection: "Up",
        victoryTypes: [
          { type: "SS", description: "Test", classificationPoints: [4, 0] }
        ]
      });
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('classificationPoints'))).toBe(true);
  });

  // ── Automatic victory type determination ──────────────────────────────────

  test("Auto-detects TÜ victory type and winner when score difference >= 15", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // 5R + 5R + 5R = 15 for Red, Blue = 0 → scoreDifference = 15
    await recordEventAtTime(page, "2:50", ["5", "R"]);
    await recordEventAtTime(page, "2:40", ["5", "R"]);
    await recordEventAtTime(page, "2:30", ["5", "R"]);

    await page.keyboard.press("F4"); // Enter Completing mode

    await expect(page.locator("#compl-winner")).toHaveValue("red");
    await expect(page.locator("#compl-victory-type")).toHaveValue("TÜ");
    await expect(page.locator("#compl-points-red")).toHaveValue("4");
    await expect(page.locator("#compl-points-blue")).toHaveValue("0");
  });

  test("Auto-detects DV victory type and winner when caution count >= 3", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // 3 cautions for Red (each awards 1 point to Blue → Blue wins)
    await recordEventAtTime(page, "2:50", ["R", "0", "1"]); // 0R1B
    await recordEventAtTime(page, "2:40", ["R", "0", "1"]); // 0R1B
    await recordEventAtTime(page, "2:30", ["R", "0", "1"]); // 0R1B

    await page.keyboard.press("F4"); // Enter Completing mode

    await expect(page.locator("#compl-winner")).toHaveValue("blue");
    await expect(page.locator("#compl-victory-type")).toHaveValue("DV");
  });

  test("Auto-detects PS victory type when score difference falls in conditional points band (diff=5)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Red 6, Blue 1 → diff=5 → PS with 2 classification points for red
    await recordEventAtTime(page, "2:50", ["4", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "R"]);
    await recordEventAtTime(page, "2:30", ["1", "B"]);

    await page.keyboard.press("F4"); // Enter Completing mode

    await expect(page.locator("#compl-winner")).toHaveValue("red");
    await expect(page.locator("#compl-victory-type")).toHaveValue("PS");
    await expect(page.locator("#compl-points-red")).toHaveValue("2");
    await expect(page.locator("#compl-points-blue")).toHaveValue("0");
  });

  test("Auto-detects PS with 1 classification point when score difference is in 0-2 band", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Red 1, Blue 0 → diff=1 → PS with 1 classification point
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("F4"); // Enter Completing mode

    await expect(page.locator("#compl-winner")).toHaveValue("red");
    await expect(page.locator("#compl-victory-type")).toHaveValue("PS");
    await expect(page.locator("#compl-points-red")).toHaveValue("1");
    await expect(page.locator("#compl-points-blue")).toHaveValue("0");
  });

  test("Auto-detects PS with 3 classification points when score difference is in 8-14 band", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Red 10, Blue 0 → diff=10 → PS with 3 classification points
    await recordEventAtTime(page, "2:50", ["5", "R"]);
    await recordEventAtTime(page, "2:40", ["5", "R"]);

    await page.keyboard.press("F4"); // Enter Completing mode

    await expect(page.locator("#compl-winner")).toHaveValue("red");
    await expect(page.locator("#compl-victory-type")).toHaveValue("PS");
    await expect(page.locator("#compl-points-red")).toHaveValue("3");
    await expect(page.locator("#compl-points-blue")).toHaveValue("0");
  });

  test("TÜ takes priority over PS when score difference >= 15", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Red 15, Blue 0 → diff=15 → TÜ (not PS)
    await recordEventAtTime(page, "2:50", ["5", "R"]);
    await recordEventAtTime(page, "2:40", ["5", "R"]);
    await recordEventAtTime(page, "2:30", ["5", "R"]);

    await page.keyboard.press("F4"); // Enter Completing mode

    await expect(page.locator("#compl-winner")).toHaveValue("red");
    await expect(page.locator("#compl-victory-type")).toHaveValue("TÜ");
  });

  test("No auto-detected victory type when scores are equal", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Equal scores → no winner → no auto-detection
    await recordEventAtTime(page, "2:50", ["2", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("F4"); // Enter Completing mode

    await expect(page.locator("#compl-winner")).toHaveValue("-");
    await expect(page.locator("#compl-victory-type")).toHaveValue("-");
  });

  test("Auto-update switches from TÜ to PS when condition no longer holds after new event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Bring Red to 15 → TÜ auto-detected
    await recordEventAtTime(page, "2:50", ["5", "R"]);
    await recordEventAtTime(page, "2:40", ["5", "R"]);
    await recordEventAtTime(page, "2:30", ["5", "R"]);

    await page.keyboard.press("F4"); // Enter Completing mode
    await expect(page.locator("#compl-victory-type")).toHaveValue("TÜ");

    // Blue scores 5 → diff drops to 10 → TÜ no longer applies, PS (3 pts) applies
    await recordEventAtTime(page, "2:20", ["5", "B"]);

    await expect(page.locator("#compl-winner")).toHaveValue("red");
    await expect(page.locator("#compl-victory-type")).toHaveValue("PS");
    await expect(page.locator("#compl-points-red")).toHaveValue("3");
    await expect(page.locator("#compl-points-blue")).toHaveValue("0");
  });
});
