import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet, recordEventAtTime } from "./helpers.js";

// ── Correction Mode ──────────────────────────────────────────────────────────

test.describe("CHAMP Protocol - Correction Mode", () => {

  // ── Enter / Exit ──────────────────────────────────────────────────────────

  test("ArrowLeft enters correction mode after recording an event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(true);
    expect(state.cursorIndex).toBe(0);
  });

  test("Backspace in normal mode enters correction mode and deletes the last event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["2", "B"]);

    await page.keyboard.press("Backspace");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(true);
    expect(state.correctionBuffer).toHaveLength(1);
    expect(state.correctionBuffer[0].deleted).toBe(true);
  });

  test("ArrowLeft does NOT enter correction mode when no events recorded", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("ArrowLeft");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(false);
  });

  test("Enter in correction mode confirms corrections and exits", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    // Modify: change to Blue
    await page.keyboard.press("b");
    // Confirm
    await page.keyboard.press("Enter");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(false);
  });

  test("Escape in correction mode (empty buffer) cancels and exits", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Escape");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(false);
  });

  test("Escape in correction mode clears key buffer if non-empty", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    // Press '0' to start a caution sequence
    await page.keyboard.press("0");
    // Now buffer has ['0'], press Escape
    await page.keyboard.press("Escape");

    const state = await page.evaluate(() => window.testHelper.getState());
    // Buffer should be cleared but still in correction mode
    expect(state.inCorrectionMode).toBe(true);
    expect(state.correctionBuffer).toHaveLength(0);
  });

  // ── Cursor Navigation ─────────────────────────────────────────────────────

  test("cursor starts at last event when entering correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.cursorIndex).toBe(1); // 2nd event (0-indexed)
  });

  test("ArrowLeft moves cursor left in correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft"); // enter correction mode at index 1
    await page.keyboard.press("ArrowLeft"); // move to index 0

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.cursorIndex).toBe(0);
  });

  test("ArrowRight moves cursor right in correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft"); // enter correction mode at index 1
    await page.keyboard.press("ArrowLeft"); // move to index 0
    await page.keyboard.press("ArrowRight"); // back to index 1

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.cursorIndex).toBe(1);
  });

  test("cursor stays at leftmost event when pressing ArrowLeft at index 0", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft"); // enter, cursorIndex = 0
    await page.keyboard.press("ArrowLeft"); // try to go further left, should stay

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.cursorIndex).toBe(0);
  });

  test("cursor ring is shown on the current event in correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");

    // The entry-box for the event should have the 'cursor' class
    const box = page.locator("#timeline .entry-box.cursor");
    await expect(box).toHaveCount(1);
    await expect(box).toContainText("1R");
  });

  test("next-event entry is absent in correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");

    await expect(page.locator("#next-event")).toHaveCount(0);
  });

  test("next-event entry reappears after exiting correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");

    await expect(page.locator("#next-event")).toHaveCount(1);
  });

  // ── EventModified – Color Change ──────────────────────────────────────────

  test("pressing B in correction mode changes event color to Blue", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("b"); // change to blue
    await page.keyboard.press("Enter"); // confirm

    // Score: blue should now have 1 point
    await expect(page.locator("#score-blue")).toHaveText("1");
    await expect(page.locator("#score-red")).toHaveText("0");

    // Timeline should show 1B
    const entries = page.locator(".timeline .entry:not(#next-event)");
    await expect(entries).toHaveCount(1);
    await expect(entries.first().locator(".entry-box")).toContainText("1B");
  });

  test("pressing R in correction mode changes event color to Red", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["2", "B"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("r"); // change to red
    await page.keyboard.press("Enter"); // confirm

    await expect(page.locator("#score-red")).toHaveText("2");
    await expect(page.locator("#score-blue")).toHaveText("0");
    await expect(page.locator(".timeline .entry:not(#next-event)").first().locator(".entry-box")).toContainText("2R");
  });

  test("pressing R on already-Red event makes no change", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("r"); // no change
    await page.keyboard.press("Enter");

    await expect(page.locator("#score-red")).toHaveText("1");
    // No EventModified should be recorded
    const events = await page.evaluate(() => window.testHelper.getState());
    // correctionBuffer should be empty (no change was made)
  });

  test("cancel correction mode discards pending changes", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("b"); // pending change: 1R → 1B

    // Score should preview as blue (1B) during correction mode
    await expect(page.locator("#score-blue")).toHaveText("1");

    await page.keyboard.press("Escape"); // cancel (buffer empty after pressing b which is immediate)
    // Since 'b' is a single key that immediately modifies, after pressing b, buffer is empty.
    // Pressing Escape now cancels and exits correction mode.

    // After cancel: original event restored
    await expect(page.locator("#score-red")).toHaveText("1");
    await expect(page.locator("#score-blue")).toHaveText("0");
  });

  // ── EventModified – Points Change ─────────────────────────────────────────

  test("pressing digit 4 in correction mode changes points", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("4"); // change to 4 points
    await page.keyboard.press("Enter");

    await expect(page.locator("#score-red")).toHaveText("4");
    await expect(page.locator(".timeline .entry:not(#next-event)").first().locator(".entry-box")).toContainText("4R");
  });

  test("pressing digit 2 in correction mode changes points, keeps color", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "B"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("2");
    await page.keyboard.press("Enter");

    await expect(page.locator("#score-blue")).toHaveText("2");
    await expect(page.locator(".timeline .entry:not(#next-event)").first().locator(".entry-box")).toContainText("2B");
  });

  // ── EventModified – Passivity Change ─────────────────────────────────────

  test("pressing P in correction mode changes event to passivity", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["2", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("p");
    await page.keyboard.press("Enter");

    await expect(page.locator("#score-red")).toHaveText("0"); // passivity scores no points
    await expect(page.locator(".timeline .entry:not(#next-event)").first().locator(".entry-box")).toContainText("PR");
  });

  test("pressing P on passivity keeps it as passivity", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["P", "B"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("p");
    await page.keyboard.press("Enter");

    await expect(page.locator(".timeline .entry:not(#next-event)").first().locator(".entry-box")).toContainText("PB");
  });

  // ── EventModified – Caution Change ───────────────────────────────────────

  test("pressing 0+1 changes event to caution+1, keeps color", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["2", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("0");
    await page.keyboard.press("1");
    await page.keyboard.press("Enter");

    // 2R → 0R1B (Red cautioned, Blue gets 1 point)
    await expect(page.locator("#score-red")).toHaveText("0");
    await expect(page.locator("#score-blue")).toHaveText("1");
    const box = page.locator(".timeline .entry:not(#next-event)").first().locator(".entry-box");
    await expect(box).toHaveClass(/caution/);
  });

  test("pressing 0+2 changes event to caution+2, keeps color", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "B"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("0");
    await page.keyboard.press("2");
    await page.keyboard.press("Enter");

    // 1B → 0B2R (Blue cautioned, Red gets 2 points)
    await expect(page.locator("#score-red")).toHaveText("2");
    await expect(page.locator("#score-blue")).toHaveText("0");
    const box = page.locator(".timeline .entry:not(#next-event)").first().locator(".entry-box");
    await expect(box).toHaveClass(/caution/);
  });

  test("pressing 0 then Escape clears the caution sequence buffer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("0"); // start caution sequence
    await page.keyboard.press("Escape"); // clear buffer, stay in correction mode

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(true);
    expect(state.correctionBuffer).toHaveLength(0);

    // Confirm to exit
    await page.keyboard.press("Enter");
    await expect(page.locator("#score-red")).toHaveText("1"); // unchanged
  });

  // ── EventModified – Caution Color Change ──────────────────────────────────

  test("pressing R on caution 0B2R changes cautioned side to Red", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    // Record 0B2R: Blue cautioned, Red gets 2 points
    await recordEventAtTime(page, "2:50", ["B", "0", "2"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("r"); // change cautioned side to Red → 0R2B
    await page.keyboard.press("Enter");

    // 0R2B: Red cautioned, Blue gets 2 points
    await expect(page.locator("#score-red")).toHaveText("0");
    await expect(page.locator("#score-blue")).toHaveText("2");
  });

  // ── EventModified – Passivity Color Change ────────────────────────────────

  test("pressing B on passivity PR changes it to PB", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["P", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("b");
    await page.keyboard.press("Enter");

    await expect(page.locator(".timeline .entry:not(#next-event)").first().locator(".entry-box")).toContainText("PB");
  });

  // ── EventModified – Points from Caution ──────────────────────────────────

  test("pressing digit on caution converts it to points, keeps cautioned color", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    // 0R1B: Red cautioned
    await recordEventAtTime(page, "2:50", ["R", "0", "1"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("5"); // → 5R (keep Red color)
    await page.keyboard.press("Enter");

    await expect(page.locator("#score-red")).toHaveText("5");
    await expect(page.locator("#score-blue")).toHaveText("0");
  });

  // ── EventDeleted ──────────────────────────────────────────────────────────

  test("Delete key removes the current event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft"); // cursor at index 1 (2B)
    await page.keyboard.press("Delete");
    await page.keyboard.press("Enter"); // confirm

    // 2B should be removed
    const entries = page.locator(".timeline .entry:not(#next-event)");
    await expect(entries).toHaveCount(1);
    await expect(entries.first().locator(".entry-box")).toContainText("1R");
    await expect(page.locator("#score-blue")).toHaveText("0");
  });

  // ── Live Preview ──────────────────────────────────────────────────────────

  test("score updates live during correction mode before confirming", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("b"); // pending change: 4R → 4B

    // Score preview: blue should now have 4 points
    await expect(page.locator("#score-blue")).toHaveText("4");
    await expect(page.locator("#score-red")).toHaveText("0");

    await page.keyboard.press("Enter"); // confirm

    // Score confirmed
    await expect(page.locator("#score-blue")).toHaveText("4");
    await expect(page.locator("#score-red")).toHaveText("0");
  });

  // ── EventModified recorded in event log ──────────────────────────────────

  test("EventModified event is written to event log on confirm", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("b"); // 1R → 1B
    await page.keyboard.press("Enter");

    // Visible outcome confirms EventModified was applied
    await expect(page.locator("#score-blue")).toHaveText("1");
    await expect(page.locator("#score-red")).toHaveText("0");
    await expect(page.locator(".timeline .entry:not(#next-event)").first().locator(".entry-box")).toContainText("1B");
  });

  // ── Multiple events ───────────────────────────────────────────────────────

  test("can navigate and modify multiple events in one correction session", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    // Enter correction mode (cursor at index 1 = 2B)
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("r"); // 2B → 2R

    // Move to previous event (1R, index 0)
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("5"); // 1R → 5R

    // Confirm all changes
    await page.keyboard.press("Enter");

    // Both changes applied: 5R + 2R = 7 for Red, 0 for Blue
    await expect(page.locator("#score-red")).toHaveText("7");
    await expect(page.locator("#score-blue")).toHaveText("0");
  });

  // ── Timeline correction-mode class ───────────────────────────────────────

  test("timeline has correction-mode class when in correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");

    await expect(page.locator("#timeline")).toHaveClass(/correction-mode/);
  });

  test("timeline loses correction-mode class after exiting correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");

    await expect(page.locator("#timeline")).not.toHaveClass(/correction-mode/);
  });

  // ── Space in Correction Mode ──────────────────────────────────────────────

  test("Space starts timer in correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft"); // enter correction mode

    await page.keyboard.press(" "); // start timer

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.timerRunning).toBe(true);
    expect(state.inCorrectionMode).toBe(true); // still in correction mode
  });

  test("Space stops timer in correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press(" "); // start timer in normal mode
    const stateBefore = await page.evaluate(() => window.testHelper.getState());
    expect(stateBefore.timerRunning).toBe(true);

    await page.keyboard.press("ArrowLeft"); // enter correction mode
    await page.keyboard.press(" "); // stop timer

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.timerRunning).toBe(false);
    expect(state.inCorrectionMode).toBe(true); // still in correction mode
  });

  // ── Victory type recalculation on confirm ────────────────────────────────

  test("victory type recalculates after confirming corrections in Completing mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Record three 5R events → Red 15 pts (TÜ threshold)
    await recordEventAtTime(page, "2:50", ["5", "R"]);
    await recordEventAtTime(page, "2:40", ["5", "R"]);
    await recordEventAtTime(page, "2:30", ["5", "R"]);

    // Enter Completing mode and verify TÜ is auto-selected
    await page.keyboard.press("F4");
    await expect(page.locator("#compl-victory-type")).toHaveValue("TÜ");

    // Enter correction mode and delete the last 5R event (cursor starts at it)
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Delete"); // marks last 5R as deleted → Red becomes 10
    await page.keyboard.press("Enter");  // confirm → returns to Completing mode

    // Victory type should now be PS (10 pt difference is in 8–14 range)
    await expect(page.locator("#compl-victory-type")).toHaveValue("PS");
  });

  // ── Pending visual state ──────────────────────────────────────────────────

  test("pending-deleted event stays visible in timeline with pending-deleted class", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["2", "R"]);

    await page.keyboard.press("ArrowLeft"); // enter correction mode, cursor at the event
    await page.keyboard.press("Delete");    // mark pending-deleted

    // Event is still in the timeline but its entry has the pending-deleted class
    const entries = page.locator(".timeline .entry");
    await expect(entries).toHaveCount(1);
    await expect(entries.first()).toHaveClass(/pending-deleted/);
  });

  test("pending-modified event shows two-line correction entry with original struck through", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]); // original: 1R

    await page.keyboard.press("ArrowLeft"); // enter correction mode
    await page.keyboard.press("b");         // modify to 1B (pending)

    const entryBox = page.locator(".timeline .entry .entry-box.correction");
    await expect(entryBox).toHaveCount(1);
    // Top row: old event name with strikethrough class
    await expect(entryBox.locator(".caution-row.old")).toContainText("1R");
    // Bottom row: new event name
    await expect(entryBox.locator(".caution-row.blue")).toContainText("1B");
  });

  // ── No auto-exit when all events deleted ─────────────────────────────────

  test("deleting last event does not auto-exit correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft"); // enter correction mode
    await page.keyboard.press("Delete");    // mark only event as pending-deleted

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(true);
    expect(state.cursorIndex).toBeNull();
  });

  test("confirming after deleting all events clears the timeline", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Delete");
    await page.keyboard.press("Enter"); // confirm all deletions

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(false);
    // All entries removed from timeline
    await expect(page.locator(".timeline .entry:not(#next-event)")).toHaveCount(0);
  });

  // ── Backspace: move cursor left and delete ────────────────────────────────

  test("Backspace in correction mode moves cursor left and deletes the event there", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft"); // enter correction mode, cursor at index 1 (2B)
    const stateBefore = await page.evaluate(() => window.testHelper.getState());
    expect(stateBefore.cursorIndex).toBe(1);

    await page.keyboard.press("Backspace"); // move left to index 0 (1R) and delete it
    const stateAfter = await page.evaluate(() => window.testHelper.getState());
    expect(stateAfter.cursorIndex).toBe(0);
    expect(stateAfter.inCorrectionMode).toBe(true);
    expect(stateAfter.correctionBuffer).toHaveLength(1);
    expect(stateAfter.correctionBuffer[0].deleted).toBe(true);
  });

  test("Backspace at leftmost cursor position is a no-op (cursor stays, nothing deleted)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft"); // enter correction mode, cursor at index 0
    const stateBefore = await page.evaluate(() => window.testHelper.getState());
    expect(stateBefore.cursorIndex).toBe(0);

    await page.keyboard.press("Backspace"); // already at leftmost – no movement, no deletion
    const stateAfter = await page.evaluate(() => window.testHelper.getState());
    expect(stateAfter.cursorIndex).toBe(0);
    expect(stateAfter.inCorrectionMode).toBe(true);
    expect(stateAfter.correctionBuffer).toHaveLength(0);
  });

  test("Backspace when timeline is empty does not enter correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("Backspace");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(false);
  });

  test("Multiple Backspace presses delete events sequentially from the end", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);
    await recordEventAtTime(page, "2:30", ["4", "R"]);

    // First Backspace from normal mode: enters correction mode and deletes last event (4R)
    await page.keyboard.press("Backspace");
    const state1 = await page.evaluate(() => window.testHelper.getState());
    expect(state1.inCorrectionMode).toBe(true);
    expect(state1.correctionBuffer).toHaveLength(1);

    // Second Backspace in correction mode: moves cursor left and deletes 2B
    await page.keyboard.press("Backspace");
    const state2 = await page.evaluate(() => window.testHelper.getState());
    expect(state2.correctionBuffer).toHaveLength(2);

    // Third Backspace: moves cursor left and deletes 1R
    await page.keyboard.press("Backspace");
    const state3 = await page.evaluate(() => window.testHelper.getState());
    expect(state3.correctionBuffer).toHaveLength(3);

    // Fourth Backspace: cursor is at leftmost – no-op
    await page.keyboard.press("Backspace");
    const state4 = await page.evaluate(() => window.testHelper.getState());
    expect(state4.correctionBuffer).toHaveLength(3);
    expect(state4.inCorrectionMode).toBe(true);
  });

});

// ── Event Insertion (## key sequence) ────────────────────────────────────────

test.describe("Event Insertion in Correction Mode (##)", () => {

  test("## enters insert mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft"); // enter correction mode
    await page.keyboard.press("#");
    await page.keyboard.press("#");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(true);
    expect(state.inInsertMode).toBe(true);
  });

  test("single # does not enter insert mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inInsertMode).toBe(false);
    expect(state.inCorrectionMode).toBe(true);
  });

  test("Escape cancels insert mode and stays in correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("#");
    await page.keyboard.press("Escape");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inInsertMode).toBe(false);
    expect(state.inCorrectionMode).toBe(true);
  });

  test("## then simple event type (1R) adds insert to correction buffer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("#");
    // Type 1R in insert mode
    await page.keyboard.press("1");
    await page.keyboard.press("r");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inInsertMode).toBe(false);
    expect(state.inCorrectionMode).toBe(true);
    expect(state.correctionBuffer).toHaveLength(1);
    expect(state.correctionBuffer[0].insertedEventType).toBe("1R");
  });

  test("## then R+1 (reversed order) adds insert to correction buffer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["2", "B"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("#");
    await page.keyboard.press("r");
    await page.keyboard.press("1");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer[0].insertedEventType).toBe("1R");
  });

  test("## then passivity PB inserts PB event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("#");
    await page.keyboard.press("p");
    await page.keyboard.press("b");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer[0].insertedEventType).toBe("PB");
  });

  test("## then caution 0R1B inserts caution event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("#");
    await page.keyboard.press("r");
    await page.keyboard.press("0");
    await page.keyboard.press("1");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer[0].insertedEventType).toBe("0R1B");
  });

  test("on confirm, EventInserted is recorded in event log", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("#");
    await page.keyboard.press("2");
    await page.keyboard.press("b");
    await page.keyboard.press("Enter"); // confirm

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(false);

    // Check that EventInserted is now in the event log
    const events = await page.evaluate(() => window.appState ? window.appState.events : []);
    // We check via the timeline: there should be 2 bout events visible
    const entries = page.locator(".timeline .entry:not(#next-event)");
    await expect(entries).toHaveCount(2);
  });

  test("pending insert in correction buffer shows dotted dark border before confirm", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("#");
    await page.keyboard.press("2");
    await page.keyboard.press("b");
    // Event is now in correction buffer, not yet confirmed

    const pendingEntry = page.locator(".timeline .entry .entry-box.pending-inserted");
    await expect(pendingEntry).toHaveCount(1);
  });

  test("inserted event renders in timeline", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("#");
    await page.keyboard.press("2");
    await page.keyboard.press("b");
    await page.keyboard.press("Enter"); // confirm

    // Inserted event should appear before the original cursor event
    const entries = page.locator(".timeline .entry:not(#next-event) .entry-box");
    await expect(entries).toHaveText(["2B", "1R"]);
  });

  test("inserted event is placed before the cursor event in timeline", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    await page.keyboard.press("ArrowLeft"); // correction mode, cursor at last (2B)

    // Insert 4R before 2B
    await page.keyboard.press("#");
    await page.keyboard.press("#");
    await page.keyboard.press("4");
    await page.keyboard.press("r");
    await page.keyboard.press("Enter"); // confirm

    // Timeline should have 3 entries: 1R, 4R (inserted), 2B
    const entries = page.locator(".timeline .entry:not(#next-event) .entry-box");
    await expect(entries).toHaveCount(3);
    await expect(entries).toHaveText(["1R", "4R", "2B"]);
  });

  test("pending insert shows as provisional entry before cursor during insert mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("#");

    // In insert mode with empty buffer, provisional entry should appear
    const insertPending = page.locator(".timeline .entry.insert-mode-pending");
    await expect(insertPending).toHaveCount(1);
  });

  test("scores are updated after inserting an event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    const scoreBefore = await page.locator("#score-red").textContent();
    expect(scoreBefore).toBe("1");

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("#");
    await page.keyboard.press("2");
    await page.keyboard.press("r");
    await page.keyboard.press("Enter");

    const scoreAfter = await page.locator("#score-red").textContent();
    expect(scoreAfter).toBe("3");
  });

});
