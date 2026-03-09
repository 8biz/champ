import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet, recordEventAtTime } from "./helpers.js";

// ── Correction Mode – Time Modification (T key) ───────────────────────────────

test.describe("CHAMP Protocol - Correction Mode Time Modification", () => {

  // ── Opening the modal ─────────────────────────────────────────────────────

  test("T key in correction mode opens the time modification modal", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft"); // enter correction mode
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
  });

  test("modal is pre-filled with the cursor event's elapsed bout time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    // Record event at 2:50 remaining → 10 s elapsed → boutTime = 0:10
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft"); // enter correction mode
    await page.keyboard.press("t");

    // boutTime for this event is 10 s (3:00 - 2:50 = 0:10 elapsed)
    await expect(page.locator("#time-mod-input")).toHaveValue("0:10");
  });

  test("T key does NOT open modal when cursor is null (no events)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    // No events recorded – correction mode cannot be entered, so T in normal mode
    // should not open the modal (it goes to key buffer, not modal)
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
  });

  test("Escape closes the correction time modal without modifying the buffer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await expect(page.locator("#time-mod-modal")).toBeVisible();

    await page.locator("#time-mod-input").press("Escape");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer).toHaveLength(0);
  });

  // ── Correction buffer ─────────────────────────────────────────────────────

  test("Confirming a new time adds a timeModified entry to correctionBuffer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    const state = await page.evaluate(() => window.testHelper.getState());
    const tm = state.correctionBuffer.find(c => c.timeModified);
    expect(tm).toBeDefined();
    expect(tm.newBoutTime100ms).toBe(50); // 5 s = 50 × 100 ms
    expect(tm.eventType).toBe("1R");
  });

  test("timeModified correction stores the old boutTime100ms", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    // 3:00 - 2:50 = 10 s elapsed → boutTime100ms = 100
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    const state = await page.evaluate(() => window.testHelper.getState());
    const tm = state.correctionBuffer.find(c => c.timeModified);
    expect(tm.oldBoutTime100ms).toBe(100); // 10 s original elapsed time
  });

  test("correctionBuffer has exactly one entry for the modified event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer).toHaveLength(1);
  });

  test("T followed by modal cancellation leaves correctionBuffer empty", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-cancel").click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer).toHaveLength(0);
  });

  // ── Validation ────────────────────────────────────────────────────────────

  test("Invalid format shows error and keeps modal open", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("abc");
    await page.locator("#time-mod-input").press("Enter");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await expect(page.locator("#time-mod-error")).toBeVisible();
  });

  test("Time larger than current bout time shows error", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    // Record event at 10 s elapsed (boutTime = 100)
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    // current total boutTime100ms = 100 (10 s)

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    // Enter time larger than current boutTime
    await page.locator("#time-mod-input").fill("0:30");
    await page.locator("#time-mod-input").press("Enter");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await expect(page.locator("#time-mod-error")).toBeVisible();
  });

  // ── Visual rendering ──────────────────────────────────────────────────────

  test("old event is shown as pending-deleted after time modification", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    // The original event entry should have the pending-deleted class
    await expect(page.locator(".timeline .entry.pending-deleted")).toHaveCount(1);
  });

  test("new event is shown as pending-inserted after time modification", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    // A pending-inserted entry-box should appear
    await expect(page.locator(".timeline .entry-box.pending-inserted")).toHaveCount(1);
  });

  test("old event's time is highlighted with time-modified class", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    // The deleted entry's time element should have the time-modified class
    await expect(
      page.locator(".timeline .entry.pending-deleted .entry-time.time-modified")
    ).toHaveCount(1);
  });

  test("new event's time is highlighted with time-modified class", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    // The inserted entry's time element should also have the time-modified class
    await expect(
      page.locator(".timeline .entry-box.pending-inserted ~ .entry-time.time-modified")
    ).toHaveCount(1);
  });

  // ── Chronological sorting ─────────────────────────────────────────────────

  test("new event appears before a later event when moved to earlier time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    // Two events: 1R at 0:10, 2B at 0:20
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    // Enter correction mode, navigate to 2B (index 1), change time to 0:05
    await page.keyboard.press("ArrowLeft"); // cursor on 2B (last event)
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    // Get timeline entry-time elements (non-deleted only)
    const insertedEntry = page.locator(".entry-box.pending-inserted").locator("..");
    const insertedTime = insertedEntry.locator(".entry-time");
    await expect(insertedTime).toHaveText("0:05.0");

    // The pending-inserted entry-box should appear before 1R (which stays at 0:10)
    const entries = page.locator(".timeline .entry");
    // New 2B at 0:05 should be first visible entry
    const firstEntryTime = entries.first().locator(".entry-time");
    await expect(firstEntryTime).toHaveText("0:05.0");
  });

  test("new event appears after an earlier event when moved to later time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    // Two events: 1R at 0:10, 2B at 0:20
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    // Navigate to 1R (index 0), move it to 0:15 (after 1R's original time but before 2B)
    await page.keyboard.press("ArrowLeft"); // cursor on 2B (last)
    await page.keyboard.press("ArrowLeft"); // cursor on 1R (first)
    await page.keyboard.press("t");
    // New elapsed time 0:15 > 1R original (0:10) but < 2B (0:20) - within current boutTime
    await page.locator("#time-mod-input").fill("0:15");
    await page.locator("#time-mod-input").press("Enter");

    // The pending-inserted box (1R at 0:15) should have time "0:15.0"
    const insertedEntry = page.locator(".entry-box.pending-inserted").locator("..");
    await expect(insertedEntry.locator(".entry-time")).toHaveText("0:15.0");
  });

  // ── Commit (Enter) ────────────────────────────────────────────────────────

  test("confirming with Enter commits EventDeleted and EventInserted", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");
    // Confirm corrections
    await page.keyboard.press("Enter");

    const events = await page.evaluate(() => window.exportHelper.generate().bout.events);
    expect(events.some(e => e.eventType === "EventDeleted")).toBe(true);
    expect(events.some(e => e.eventType === "EventInserted")).toBe(true);
  });

  test("after commit the event appears at the new bout time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]); // 0:10 elapsed

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");
    await page.keyboard.press("Enter"); // confirm

    const events = await page.evaluate(() => window.exportHelper.generate().bout.events);
    const inserted = events.find(e => e.eventType === "EventInserted");
    expect(inserted).toBeDefined();
    expect(inserted.boutTime100ms).toBe(50); // 5 s = 50 × 100 ms
  });

  test("after commit timeline shows event at new time, not old time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");
    await page.keyboard.press("Enter"); // confirm

    // After confirming, the timeline should show 0:05.0 (not 0:10.0)
    const times = await page.locator(".timeline .entry-time").allTextContents();
    expect(times.some(t => t.startsWith("0:05"))).toBe(true);
    expect(times.some(t => t.startsWith("0:10"))).toBe(false);
  });

  test("sorting: events in timeline are in ascending order after commit", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]); // 0:10
    await recordEventAtTime(page, "2:40", ["2", "B"]); // 0:20

    // Move 2B (at 0:20) to 0:05 (before 1R at 0:10)
    await page.keyboard.press("ArrowLeft"); // cursor on 2B
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");
    await page.keyboard.press("Enter"); // confirm

    const times = await page.locator(".timeline .entry-time").allTextContents();
    // Filter only valid time entries (M:SS or M:SS.f format)
    const timeValues = times
      .filter(t => /^\d+:\d/.test(t))
      .map(t => {
        const [m, rest] = t.split(":");
        const s = parseFloat(rest);
        return parseInt(m) * 60 + s;
      });
    for (let i = 0; i < timeValues.length - 1; i++) {
      expect(timeValues[i]).toBeLessThanOrEqual(timeValues[i + 1]);
    }
  });

  // ── Preserving event type ─────────────────────────────────────────────────

  test("time modification preserves the event type", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["2", "B"]); // 2B event

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    const state = await page.evaluate(() => window.testHelper.getState());
    const tm = state.correctionBuffer.find(c => c.timeModified);
    expect(tm.eventType).toBe("2B");
  });

  // ── Interaction with other corrections ───────────────────────────────────

  test("T key supersedes a pending newEventType correction for the same event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    // First change event type: 1R → 2R
    await page.keyboard.press("2");
    const stateAfterMod = await page.evaluate(() => window.testHelper.getState());
    expect(stateAfterMod.correctionBuffer.some(c => c.newEventType === "2R")).toBe(true);

    // Then modify time: this should supersede the type-change correction
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    const state = await page.evaluate(() => window.testHelper.getState());
    // Only timeModified correction should remain (newEventType correction removed)
    expect(state.correctionBuffer).toHaveLength(1);
    const tm = state.correctionBuffer.find(c => c.timeModified);
    expect(tm).toBeDefined();
    // Event type should be the effective type (2R) at time of T press
    expect(tm.eventType).toBe("2R");
  });

  // ── Stays in correction mode ──────────────────────────────────────────────

  test("app stays in correction mode after time modification", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(true);
  });

  // ── Multiple events ───────────────────────────────────────────────────────

  test("T key can modify the time of the second event in a multi-event timeline", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]); // 0:10
    await recordEventAtTime(page, "2:40", ["2", "B"]); // 0:20

    // cursor starts on 2B (last event)
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    // 0:15 is valid (< 0:20 current boutTime)
    await page.locator("#time-mod-input").fill("0:15");
    await page.locator("#time-mod-input").press("Enter");

    const state = await page.evaluate(() => window.testHelper.getState());
    const tm = state.correctionBuffer.find(c => c.timeModified);
    expect(tm).toBeDefined();
    expect(tm.eventType).toBe("2B");
    expect(tm.newBoutTime100ms).toBe(150); // 15 s = 150 × 100 ms
  });

  // ── Cursor placement after time modification ──────────────────────────────

  test("cursor moves to the changed event after T key time modification", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    // The time-modified virtual entry (pending-inserted, shown with dotted border) should carry the cursor
    await expect(page.locator(".entry-box.pending-inserted.cursor")).toHaveCount(1);
  });

  test("cursor is on the pending-inserted entry with the correct new time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    // The cursored pending-inserted entry should show the new time
    await expect(page.locator(".entry:has(.entry-box.pending-inserted.cursor) .entry-time")).toHaveText("0:05.0");
  });

  test("Delete on the time-modified virtual event cancels the time modification", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    // Cursor is now on the tm- virtual event; pressing Delete cancels the time modification
    await page.keyboard.press("Delete");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer).toHaveLength(0);
  });

  test("Delete on the time-modified virtual event restores cursor to the original event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    await page.keyboard.press("Delete");

    // Cursor should be back on the original event (single real event, no pending-inserted)
    await expect(page.locator(".entry-box.pending-inserted")).toHaveCount(0);
    await expect(page.locator(".entry-box.cursor")).toHaveCount(1);
  });

  test("T key on the time-modified virtual event allows re-modification", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    // Cursor is on the tm- event; press T again to re-modify
    await page.keyboard.press("t");
    await expect(page.locator("#time-mod-modal")).toBeVisible();
    // Modal pre-filled with current modified time (0:05)
    await expect(page.locator("#time-mod-input")).toHaveValue("0:05");
  });

  test("re-modifying via T key updates the correction (single buffer entry)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:05");
    await page.locator("#time-mod-input").press("Enter");

    // Re-modify to 0:08
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("0:08");
    await page.locator("#time-mod-input").press("Enter");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer).toHaveLength(1);
    const tm = state.correctionBuffer.find(c => c.timeModified);
    expect(tm).toBeDefined();
    expect(tm.newBoutTime100ms).toBe(80); // 8 s = 80 × 100 ms
  });
});
