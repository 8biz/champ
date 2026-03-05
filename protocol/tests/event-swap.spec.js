import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet, recordEventAtTime } from "./helpers.js";

// ── Event Swap Mode ──────────────────────────────────────────────────────────

test.describe("Event Swap Mode", () => {

  // ── Enter / Exit ─────────────────────────────────────────────────────────

  test("# enters swap mode in correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft"); // enter correction mode
    await page.keyboard.press("#");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(true);
    expect(state.inSwapMode).toBe(true);
    expect(state.inInsertMode).toBe(false);
  });

  test("Escape in swap mode cancels and returns cursor to origin", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft"); // correction mode at index 1
    await page.keyboard.press("#");         // enter swap mode at index 1
    await page.keyboard.press("ArrowLeft"); // move cursor to index 0
    await page.keyboard.press("Escape");    // cancel swap mode

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inSwapMode).toBe(false);
    expect(state.inCorrectionMode).toBe(true);
    expect(state.cursorIndex).toBe(1); // cursor back at origin
  });

  test("Escape in swap mode (no movement) stays in correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("Escape");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inSwapMode).toBe(false);
    expect(state.inCorrectionMode).toBe(true);
    expect(state.cursorIndex).toBe(0);
  });

  test("Enter in swap mode with no movement does not add to correction buffer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("Enter"); // no movement → no swap

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inSwapMode).toBe(false);
    expect(state.inCorrectionMode).toBe(true);
    expect(state.correctionBuffer).toHaveLength(0);
  });

  test("## transitions through swap mode into insert mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#"); // → swap mode
    await page.keyboard.press("#"); // → insert mode

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inSwapMode).toBe(false);
    expect(state.inInsertMode).toBe(true);
    expect(state.inCorrectionMode).toBe(true);
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  test("ArrowLeft moves cursor left in swap mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft"); // correction mode, cursor at index 1
    await page.keyboard.press("#");         // swap mode, origin = 1
    await page.keyboard.press("ArrowLeft"); // cursor moves to index 0

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.cursorIndex).toBe(0);
    expect(state.inSwapMode).toBe(true);
  });

  test("ArrowRight moves cursor right in swap mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft"); // correction mode, cursor at index 1
    await page.keyboard.press("ArrowLeft"); // move to index 0
    await page.keyboard.press("#");         // swap mode, origin = 0
    await page.keyboard.press("ArrowRight"); // cursor moves to index 1

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.cursorIndex).toBe(1);
    expect(state.inSwapMode).toBe(true);
  });

  // ── Confirming Swap ───────────────────────────────────────────────────────

  test("Enter in swap mode after moving adds EventSwapped to correction buffer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft"); // correction mode, cursor at 1 (2B)
    await page.keyboard.press("#");         // swap mode
    await page.keyboard.press("ArrowLeft"); // cursor to 0 (1R)
    await page.keyboard.press("Enter");     // confirm swap

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inSwapMode).toBe(false);
    expect(state.inCorrectionMode).toBe(true);
    expect(state.correctionBuffer).toHaveLength(1);
    expect(state.correctionBuffer[0].swapped).toBe(true);
  });

  test("confirming swap + Enter records EventSwapped in event log", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter"); // confirm swap into buffer
    await page.keyboard.press("Enter"); // confirm corrections (write to event log)

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(false);

    const events = await page.evaluate(() => window.testHelper.getState());
    // After confirming: 1R and 2B swapped → 2B at 2:50, 1R at 2:40
    const entries = page.locator(".timeline .entry:not(#next-event) .entry-box");
    await expect(entries).toHaveText(["2B", "1R"]);
  });

  // ── Timeline Visualization ────────────────────────────────────────────────

  test("pending swap shows two-line display for both swapped events", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft"); // correction mode, cursor at 1 (2B)
    await page.keyboard.press("#");         // swap mode
    await page.keyboard.press("ArrowLeft"); // cursor to 0 (1R) → swap preview active
    await page.keyboard.press("Enter");     // confirm swap into buffer (still in correction mode)

    // Both swapped entries should show two-line correction display
    const correctionBoxes = page.locator(".timeline .entry-box.correction");
    await expect(correctionBoxes).toHaveCount(2);

    // First entry (was 1R, now shows 2B): old=1R struck through, new=2B
    await expect(correctionBoxes.first().locator(".caution-row.old")).toContainText("1R");
    await expect(correctionBoxes.first().locator(".caution-row.blue")).toContainText("2B");

    // Second entry (was 2B, now shows 1R): old=2B struck through, new=1R
    await expect(correctionBoxes.last().locator(".caution-row.old")).toContainText("2B");
    await expect(correctionBoxes.last().locator(".caution-row.red")).toContainText("1R");
  });

  test("live swap preview shows two-line display while navigating in swap mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft"); // correction mode at index 1
    await page.keyboard.press("#");         // swap mode
    await page.keyboard.press("ArrowLeft"); // cursor to index 0 → preview

    // Preview: both events show two-line display
    const correctionBoxes = page.locator(".timeline .entry-box.correction");
    await expect(correctionBoxes).toHaveCount(2);
  });

  test("cursor entry has swap-mode class in swap mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft"); // correction mode at index 1
    await page.keyboard.press("#");         // swap mode
    await page.keyboard.press("ArrowLeft"); // cursor to index 0

    // The cursor entry-box should have 'swap-mode' class
    const swapCursor = page.locator(".timeline .entry-box.cursor.swap-mode");
    await expect(swapCursor).toHaveCount(1);
  });

  test("swap origin entry has swap-origin class when cursor is elsewhere", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft"); // correction mode at index 1
    await page.keyboard.press("#");         // swap mode, origin = index 1
    await page.keyboard.press("ArrowLeft"); // cursor to index 0

    const swapOriginEntry = page.locator(".timeline .entry.swap-origin");
    await expect(swapOriginEntry).toHaveCount(1);
  });

  // ── Score Update ──────────────────────────────────────────────────────────

  test("live swap preview does not change total scores (types swapped but all events still present)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]); // Red +1
    await recordEventAtTime(page, "2:40", ["2", "B"]); // Blue +2

    // Before swap: Red=1, Blue=2
    await expect(page.locator("#score-red")).toHaveText("1");
    await expect(page.locator("#score-blue")).toHaveText("2");

    await page.keyboard.press("ArrowLeft"); // cursor at 1 (2B)
    await page.keyboard.press("#");         // swap mode, origin = 1 (2B)
    await page.keyboard.press("ArrowLeft"); // cursor to 0 (1R) → preview: 1R↔2B swapped

    // Swapping only exchanges which time each event type is recorded at.
    // All event types still exist in the log, so total scores are unchanged.
    await expect(page.locator("#score-red")).toHaveText("1");
    await expect(page.locator("#score-blue")).toHaveText("2");
  });

  test("cancelling swap restores original scores", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]); // Red +1
    await recordEventAtTime(page, "2:40", ["2", "B"]); // Blue +2

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("ArrowLeft"); // preview: swap 1R ↔ 2B → Red=2, Blue=1

    await page.keyboard.press("Escape"); // cancel swap

    // Scores back to original
    await expect(page.locator("#score-red")).toHaveText("1");
    await expect(page.locator("#score-blue")).toHaveText("2");
  });

  // ── Full Flow ─────────────────────────────────────────────────────────────

  test("full swap flow: events show swapped types after confirming corrections", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "R"]);
    await recordEventAtTime(page, "2:40", ["1", "B"]);
    await recordEventAtTime(page, "2:30", ["2", "R"]);

    // Enter correction mode at last event (2R at index 2)
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft"); // move to index 1 (1B)
    await page.keyboard.press("#");         // swap mode, origin = 1
    await page.keyboard.press("ArrowLeft"); // cursor to index 0 (4R)
    await page.keyboard.press("Enter");     // confirm swap 1B ↔ 4R into buffer
    await page.keyboard.press("Enter");     // confirm all corrections → event log

    // After swap: 4R↔1B → timeline shows 1B, 4R, 2R
    const entries = page.locator(".timeline .entry:not(#next-event) .entry-box");
    await expect(entries).toHaveCount(3);
    await expect(entries).toHaveText(["1B", "4R", "2R"]);
  });

  test("swap does not change total scores (all event types still present in log)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]); // Red=1
    await recordEventAtTime(page, "2:40", ["2", "B"]); // Blue=2

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter"); // confirm swap
    await page.keyboard.press("Enter"); // exit correction mode

    // Swapping 1R ↔ 2B exchanges which time they occurred at, but both events
    // still exist — total scores unchanged: Red=1, Blue=2
    await expect(page.locator("#score-red")).toHaveText("1");
    await expect(page.locator("#score-blue")).toHaveText("2");
  });

  test("cancelling swap mode via Escape does not add to correction buffer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Escape"); // cancel

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer).toHaveLength(0);
    expect(state.inSwapMode).toBe(false);
    expect(state.inCorrectionMode).toBe(true);
  });

});
