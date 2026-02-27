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
});
