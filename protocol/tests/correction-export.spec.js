import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet, recordEventAtTime } from "./helpers.js";

// ── Export consistency after corrections ─────────────────────────────────────
//
// Verifies that generateExport() reflects all committed corrections
// (EventModified, EventDeleted, EventInserted) in scores, statistics,
// and timeline — matching what the browser shows on-screen.

test.describe("CHAMP Protocol - Export consistency after corrections", () => {

  // ── EventModified: side change ────────────────────────────────────────────

  test("modify event side: export score and statistics reflect new side", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Record 2R then correct it to 2B
    await recordEventAtTime(page, "2:50", ["2", "R"]);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("b"); // change side to Blue
    await page.keyboard.press("Enter"); // confirm

    // Browser should show 0:2
    await expect(page.locator("#score-red")).toHaveText("0");
    await expect(page.locator("#score-blue")).toHaveText("2");

    const exportData = await page.evaluate(() => window.exportHelper.generate());

    // Export scores must match browser
    expect(exportData.bout.summary.scores.red).toBe(0);
    expect(exportData.bout.summary.scores.blue).toBe(2);

    // Timeline must show the corrected event type 2B, not the original 2R
    const tl = exportData.bout.summary.timeline;
    expect(tl).toHaveLength(1);
    expect(tl[0].eventType).toBe("2B");

    // Statistics must count the corrected event, not the original
    expect(exportData.bout.summary.statistics.red.technicalPoints["2"]).toBe(0);
    expect(exportData.bout.summary.statistics.blue.technicalPoints["2"]).toBe(1);
  });

  // ── EventModified: points change ─────────────────────────────────────────

  test("modify event points: export score and statistics reflect new points", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Record 4R then correct it to 2R
    await recordEventAtTime(page, "2:50", ["4", "R"]);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("2"); // change points to 2
    await page.keyboard.press("Enter"); // confirm

    // Browser should show 2:0
    await expect(page.locator("#score-red")).toHaveText("2");
    await expect(page.locator("#score-blue")).toHaveText("0");

    const exportData = await page.evaluate(() => window.exportHelper.generate());

    expect(exportData.bout.summary.scores.red).toBe(2);
    expect(exportData.bout.summary.scores.blue).toBe(0);

    const tl = exportData.bout.summary.timeline;
    expect(tl).toHaveLength(1);
    expect(tl[0].eventType).toBe("2R");

    expect(exportData.bout.summary.statistics.red.technicalPoints["4"]).toBe(0);
    expect(exportData.bout.summary.statistics.red.technicalPoints["2"]).toBe(1);
  });

  // ── EventDeleted ──────────────────────────────────────────────────────────

  test("delete event: export excludes deleted event from scores and timeline", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["2", "R"]);
    await recordEventAtTime(page, "2:40", ["1", "B"]);

    // Delete the last event (1B) via Backspace
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Enter"); // confirm deletion

    // Browser should show 2:0
    await expect(page.locator("#score-red")).toHaveText("2");
    await expect(page.locator("#score-blue")).toHaveText("0");

    const exportData = await page.evaluate(() => window.exportHelper.generate());

    expect(exportData.bout.summary.scores.red).toBe(2);
    expect(exportData.bout.summary.scores.blue).toBe(0);

    // Timeline should have only the surviving 2R event
    const tl = exportData.bout.summary.timeline;
    expect(tl).toHaveLength(1);
    expect(tl[0].eventType).toBe("2R");

    expect(exportData.bout.summary.statistics.blue.technicalPoints["1"]).toBe(0);
  });

  // ── Multiple corrections ───────────────────────────────────────────────────

  test("multiple corrections: export reflects all modifications", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Record 2R, 2R, 2R (three events for red → 6:0)
    await recordEventAtTime(page, "2:50", ["2", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "R"]);
    await recordEventAtTime(page, "2:30", ["2", "R"]);

    // Change the last event (seq 3) from 2R to 2B → becomes 4:2
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("b");
    await page.keyboard.press("Enter");

    // Browser: 4:2
    await expect(page.locator("#score-red")).toHaveText("4");
    await expect(page.locator("#score-blue")).toHaveText("2");

    const exportData = await page.evaluate(() => window.exportHelper.generate());

    expect(exportData.bout.summary.scores.red).toBe(4);
    expect(exportData.bout.summary.scores.blue).toBe(2);

    // Statistics: red should have two "2" awards, blue should have one
    expect(exportData.bout.summary.statistics.red.technicalPoints["2"]).toBe(2);
    expect(exportData.bout.summary.statistics.blue.technicalPoints["2"]).toBe(1);

    // Timeline should contain the corrected sequence
    const tl = exportData.bout.summary.timeline;
    expect(tl).toHaveLength(3);
    expect(tl[0].eventType).toBe("2R");
    expect(tl[1].eventType).toBe("2R");
    expect(tl[2].eventType).toBe("2B");
  });

  // ── Reproduce exact scenario from the issue report ────────────────────────
  //
  // Score was showing 9:1 for red in the export file, but the last event
  // was modified from "2R" to "2B", so the correct score should be 7:3 for
  // red. The statistics also had wrong counts for "2" awards.

  test("issue scenario: last 2R corrected to 2B gives correct export scores and statistics", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Record five 2R events for red (total 10:0)
    // Then correct the last one to 2B → should be 8:2
    await recordEventAtTime(page, "2:58", ["2", "R"]);
    await recordEventAtTime(page, "2:56", ["2", "R"]);
    await recordEventAtTime(page, "2:54", ["2", "R"]);
    await recordEventAtTime(page, "2:52", ["2", "R"]);
    await recordEventAtTime(page, "2:50", ["2", "R"]);

    // Correct the last 2R → 2B
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("b");
    await page.keyboard.press("Enter");

    // Browser: 8:2
    await expect(page.locator("#score-red")).toHaveText("8");
    await expect(page.locator("#score-blue")).toHaveText("2");

    const exportData = await page.evaluate(() => window.exportHelper.generate());

    // Export must match browser (was broken: showed 10:0)
    expect(exportData.bout.summary.scores.red).toBe(8);
    expect(exportData.bout.summary.scores.blue).toBe(2);

    // Statistics: red should have 4 "2" awards, blue should have 1 (was 5:0 before fix)
    expect(exportData.bout.summary.statistics.red.technicalPoints["2"]).toBe(4);
    expect(exportData.bout.summary.statistics.blue.technicalPoints["2"]).toBe(1);

    // Timeline: last entry must be 2B
    const tl = exportData.bout.summary.timeline;
    expect(tl).toHaveLength(5);
    expect(tl[4].eventType).toBe("2B");

    // Corrections counter includes the 1 EventModified plus the T_Modified events
    // generated by each setBoutTime call (5 calls × 1 T_Modified = 5), totalling 6.
    expect(exportData.bout.summary.statistics.corrections).toBe(6);
  });

});
