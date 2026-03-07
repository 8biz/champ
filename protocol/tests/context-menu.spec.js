import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet, recordEventAtTime } from "./helpers.js";

// ── Mouse / Touch Correction Mode ────────────────────────────────────────────

test.describe("CHAMP Protocol - Mouse/Touch Correction Mode", () => {

  // ── Click on timeline entry enters correction mode ────────────────────────

  test("clicking a timeline entry enters correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    // Click the first (and only) event entry box
    await page.locator("#timeline .entry .entry-box").first().click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(true);
    expect(state.cursorIndex).toBe(0);
  });

  test("clicking the second of two timeline entries sets cursor to index 1", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    // Entry boxes: first is 1R, second is 2B (third is next-event)
    const entryBoxes = page.locator("#timeline .entry:not(#next-event) .entry-box");
    await entryBoxes.nth(1).click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(true);
    expect(state.cursorIndex).toBe(1);
  });

  test("clicking a timeline entry while already in correction mode moves cursor", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    // Enter correction mode on second event
    await page.keyboard.press("ArrowLeft");
    let state = await page.evaluate(() => window.testHelper.getState());
    expect(state.cursorIndex).toBe(1);

    // Click first event → cursor should move to index 0
    const firstEntryBox = page.locator("#timeline .entry:not(#next-event) .entry-box").first();
    await firstEntryBox.click();

    state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(true);
    expect(state.cursorIndex).toBe(0);
  });

  test("clicking the next-event entry does NOT enter correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#next-event .entry-box").click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(false);
  });

  test("clicking a PeriodEnd entry does NOT enter correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    // Inject a PeriodEnd event to create a period-end entry
    await page.evaluate(() => {
      window.testHelper.injectEvent({
        seq: 999,
        timestamp: new Date().toISOString(),
        eventType: 'PeriodEnd',
        boutTime100ms: 0
      });
    });

    // Click the period-end entry box
    await page.locator("#timeline .entry-box.period-end").click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(false);
  });

  // ── Right-click opens context menu ────────────────────────────────────────

  test("right-clicking a timeline entry enters correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(true);
    expect(state.cursorIndex).toBe(0);
  });

  test("right-clicking a timeline entry shows the context menu", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });

    await expect(page.locator("#context-menu")).toBeVisible();
  });

  test("context menu has delete item", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });

    await expect(page.locator("#ctx-delete")).toBeVisible();
  });

  test("context menu has insert item (disabled/no-op)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });

    await expect(page.locator("#ctx-insert")).toBeVisible();
  });

  test("context menu has swap item (disabled/no-op)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });

    await expect(page.locator("#ctx-swap")).toBeVisible();
  });

  test("context menu has time item (disabled/no-op)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });

    await expect(page.locator("#ctx-time")).toBeVisible();
  });

  test("context menu closes when clicking outside", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await expect(page.locator("#context-menu")).toBeVisible();

    // Click somewhere else
    await page.locator("#score-red").click();

    await expect(page.locator("#context-menu")).toBeHidden();
  });

  test("context menu closes when pressing Escape", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await expect(page.locator("#context-menu")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.locator("#context-menu")).toBeHidden();
  });

  // ── Context menu: delete action ───────────────────────────────────────────

  test("clicking delete in context menu deletes the cursored event (stores in buffer)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-delete").click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(true);
    expect(state.correctionBuffer).toHaveLength(1);
    expect(state.correctionBuffer[0].deleted).toBe(true);
  });

  test("clicking delete in context menu closes the context menu", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-delete").click();

    await expect(page.locator("#context-menu")).toBeHidden();
  });

  // ── Context menu: insert/swap/timer are no-ops ────────────────────────────

  test("clicking insert in context menu has no effect on correction buffer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    const stateBefore = await page.evaluate(() => window.testHelper.getState());
    await page.locator("#ctx-insert").click();
    const stateAfter = await page.evaluate(() => window.testHelper.getState());

    expect(stateAfter.correctionBuffer).toHaveLength(stateBefore.correctionBuffer.length);
  });

  // ── Event button click in correction mode modifies current event ──────────

  test("clicking event button [2B] in correction mode modifies cursored event to 2B", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    // Enter correction mode
    await page.keyboard.press("ArrowLeft");

    // Click the [2B] button
    await page.locator("#event-buttons-blue .event-btn").filter({ hasText: "[2B]" }).click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer).toHaveLength(1);
    expect(state.correctionBuffer[0].newEventType).toBe("2B");
  });

  test("clicking event button [PR] in correction mode modifies cursored event to PR", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");

    await page.locator("#event-buttons-red .event-btn").filter({ hasText: "[PR]" }).click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer).toHaveLength(1);
    expect(state.correctionBuffer[0].newEventType).toBe("PR");
  });

  test("clicking event button in correction mode does NOT record a new event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    const eventsBefore = await page.evaluate(() => window.testHelper.getState());

    await page.keyboard.press("ArrowLeft");

    await page.locator("#event-buttons-blue .event-btn").filter({ hasText: "[2B]" }).click();

    // Score should reflect the modification (1R → 2B), not a new event added
    await expect(page.locator("#score-red")).toHaveText("0");
    await expect(page.locator("#score-blue")).toHaveText("2");
  });

  test("clicking event button [0R1B] in correction mode modifies cursored event to 0R1B", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");

    await page.locator("#event-buttons-red .event-btn").filter({ hasText: "[0R1B]" }).click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer).toHaveLength(1);
    expect(state.correctionBuffer[0].newEventType).toBe("0R1B");
  });

  test("clicking event button outside correction mode still records new event normally", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    // Set bout time
    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("2:50");
    await page.locator("#time-mod-input").press("Enter");

    // Click [1R] button (not in correction mode)
    await page.locator("#event-buttons-red .event-btn").filter({ hasText: "[1R]" }).click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(false);
    await expect(page.locator("#score-red")).toHaveText("1");
  });
});
