import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet, recordEventAtTime, getAppState, generateExport, getActivityTimerState } from "./helpers.js";

// ── Activity Time ────────────────────────────────────────────────────────────
//
// The activity timer kicks in when a wrestler receives their 2nd (or more)
// passivity award in freestyle mode: the event is recorded as AR/AB instead
// of PR/PB, and a countdown timer starts.  The countdown runs in sync with
// the bout timer and is deleted when it reaches zero or the period ends.

test.describe("CHAMP Protocol - Activity Time", () => {

  // ── Condition: freestyle + ruleset ─────────────────────────────────────────

  test("1st passivity (red) in freestyle is recorded as PR, not AR", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);

    const events = await generateExport(page).then(d => d.bout.events);
    const passivity = events.find(e => e.eventType === "PR" || e.eventType === "AR");
    expect(passivity?.eventType).toBe("PR");
  });

  test("2nd passivity (red) in freestyle is recorded as AR", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    const events = await generateExport(page).then(d => d.bout.events);
    const second = events.filter(e => e.eventType === "PR" || e.eventType === "AR")[1];
    expect(second?.eventType).toBe("AR");
  });

  test("3rd passivity (red) in freestyle is also recorded as AR", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);
    await recordEventAtTime(page, "2:30", ["P", "R"]);

    const events = await generateExport(page).then(d => d.bout.events);
    const passivityEvents = events.filter(e => e.eventType === "PR" || e.eventType === "AR");
    expect(passivityEvents[0]?.eventType).toBe("PR");
    expect(passivityEvents[1]?.eventType).toBe("AR");
    expect(passivityEvents[2]?.eventType).toBe("AR");
  });

  test("2nd passivity (blue) in freestyle is recorded as AB", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "B"]);
    await recordEventAtTime(page, "2:40", ["P", "B"]);

    const events = await generateExport(page).then(d => d.bout.events);
    const second = events.filter(e => e.eventType === "PB" || e.eventType === "AB")[1];
    expect(second?.eventType).toBe("AB");
  });

  test("2nd passivity in Greco-Roman remains PB (no activity time)", async ({ page }) => {
    await page.goto(BASE_URL);
    // Switch to Greco-Roman before releasing
    await page.selectOption("#style-select", "Greco-Roman");
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "B"]);
    await recordEventAtTime(page, "2:40", ["P", "B"]);

    const events = await generateExport(page).then(d => d.bout.events);
    const second = events.filter(e => e.eventType === "PB" || e.eventType === "AB")[1];
    expect(second?.eventType).toBe("PB");
  });

  // ── Activity timer state ───────────────────────────────────────────────────

  test("Activity timer AR becomes active after 2nd red passivity", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    const state = await getAppState(page);
    expect(state.activityTimers.AR.active).toBe(true);
    expect(state.activityTimers.AR.time100ms).toBeGreaterThan(0);
  });

  test("Activity timer AB becomes active after 2nd blue passivity", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "B"]);
    await recordEventAtTime(page, "2:40", ["P", "B"]);

    const state = await getAppState(page);
    expect(state.activityTimers.AB.active).toBe(true);
  });

  test("Activity timer is loaded with activityTimeInSeconds from ruleset (default 30s = 300 units)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    const state = await getAppState(page);
    expect(state.activityTimers.AR.time100ms).toBe(300); // 30s * 10
  });

  test("Red and blue activity timers are independent", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Trigger red activity timer
    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    // Trigger blue activity timer
    await recordEventAtTime(page, "2:30", ["P", "B"]);
    await recordEventAtTime(page, "2:20", ["P", "B"]);

    const state = await getAppState(page);
    expect(state.activityTimers.AR.active).toBe(true);
    expect(state.activityTimers.AB.active).toBe(true);
  });

  // ── Activity timer synchronisation with bout timer ─────────────────────────

  test("Activity timer decrements when bout timer runs", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    const before = await getActivityTimerState(page, "AR").then(t => t.time100ms);

    // Start bout timer and let it run for ~0.5s
    await page.keyboard.press(" ");
    await page.waitForTimeout(500);
    await page.keyboard.press(" "); // stop

    const after = await getActivityTimerState(page, "AR").then(t => t.time100ms);
    expect(after).toBeLessThan(before);
  });

  test("Activity timer does NOT decrement when bout timer is stopped", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    const before = await getActivityTimerState(page, "AR").then(t => t.time100ms);

    // Wait without running the bout timer
    await page.waitForTimeout(300);

    const after = await getActivityTimerState(page, "AR").then(t => t.time100ms);
    expect(after).toBe(before);
  });

  // ── Activity timer expiry ──────────────────────────────────────────────────

  test("Activity timer becomes inactive after it reaches zero", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    // Set timer close to expiry
    await page.evaluate(() => window.testHelper.setActivityTime100ms("AR", 2));

    // Start bout timer to let it expire
    await page.keyboard.press(" ");
    await page.waitForTimeout(400);
    await page.keyboard.press(" ");

    const state = await getAppState(page);
    expect(state.activityTimers.AR.active).toBe(false);
  });

  test("Activity timer is deleted when period time ends", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    // Place period time close to zero
    await page.evaluate(() => window.testHelper.setPeriodTime100ms(2));

    // Start bout timer so period ends
    await page.keyboard.press(" ");
    await page.waitForTimeout(400);

    const state = await getAppState(page);
    expect(state.activityTimers.AR.active).toBe(false);
  });

  test("Activity timer AR is deleted when red wrestler scores points", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    const before = await getAppState(page);
    expect(before.activityTimers.AR.active).toBe(true);

    // Red scores 2 points → AR timer should be deleted
    await recordEventAtTime(page, "2:30", ["2", "R"]);

    const after = await getAppState(page);
    expect(after.activityTimers.AR.active).toBe(false);
  });

  test("Activity timer AB is deleted when blue wrestler scores points", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "B"]);
    await recordEventAtTime(page, "2:40", ["P", "B"]);

    const before = await getAppState(page);
    expect(before.activityTimers.AB.active).toBe(true);

    // Blue scores 4 points → AB timer should be deleted
    await recordEventAtTime(page, "2:30", ["4", "B"]);

    const after = await getAppState(page);
    expect(after.activityTimers.AB.active).toBe(false);
  });

  test("Activity timer AR is NOT deleted when opponent (blue) scores points", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    // Blue scores → Red's AR timer should remain active
    await recordEventAtTime(page, "2:30", ["2", "B"]);

    const state = await getAppState(page);
    expect(state.activityTimers.AR.active).toBe(true);
  });

  test("Activity timer AR entry shows single row after deletion by points", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    // Red scores → AR timer deleted
    await recordEventAtTime(page, "2:30", ["1", "R"]);

    // The AR entry should now be a plain single-row box (no timer row)
    const arBox = page.locator("#timeline .entry-box").filter({ hasText: "AR" });
    await expect(arBox).toBeVisible();
    await expect(arBox.locator(".activity-timer-row")).toHaveCount(0);
  });

  test("New AR resets activity timer when a 3rd passivity is recorded", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Trigger first activity timer
    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    // Let it run a bit
    await page.keyboard.press(" ");
    await page.waitForTimeout(600);
    await page.keyboard.press(" ");

    // Record 3rd P → new AR, timer resets to 30s
    await recordEventAtTime(page, "2:30", ["P", "R"]);

    const state = await getAppState(page);
    expect(state.activityTimers.AR.active).toBe(true);
    expect(state.activityTimers.AR.time100ms).toBe(300);
  });

  // ── Timeline display ───────────────────────────────────────────────────────

  test("AR entry in timeline has two rows when timer is active", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    // The AR entry-box should be a two-row caution-style element
    const arBox = page.locator("#timeline .entry-box.caution.red").first();
    await expect(arBox).toBeVisible();
    // Top row shows AR
    await expect(arBox.locator(".caution-row").first()).toHaveText("AR");
    // Bottom row shows a countdown in M:SS.f format
    const bottomText = await arBox.locator(".activity-timer-row").textContent();
    expect(bottomText).toMatch(/^\d:\d{2}\.\d$/);
  });

  test("AR entry shows single row (no timer row) after timer expires", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    // Expire the timer
    await page.evaluate(() => window.testHelper.setActivityTime100ms("AR", 2));
    await page.keyboard.press(" ");
    await page.waitForTimeout(400);
    await page.keyboard.press(" ");

    // The AR entry should now be a plain single-row box (top row only remains)
    const arBox = page.locator("#timeline .entry-box").filter({ hasText: "AR" });
    await expect(arBox).toBeVisible();
    await expect(arBox.locator(".activity-timer-row")).toHaveCount(0);
  });

  test("AB entry in timeline shows two rows when timer is active", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "B"]);
    await recordEventAtTime(page, "2:40", ["P", "B"]);

    const abBox = page.locator("#timeline .entry-box.caution.blue").first();
    await expect(abBox).toBeVisible();
    await expect(abBox.locator(".caution-row").first()).toHaveText("AB");
    await expect(abBox.locator(".activity-timer-row")).toBeVisible();
  });

  test("Activity timer display updates (decrements) while bout timer runs", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]);

    const before = await page.locator("#timeline .activity-timer-row").first().textContent();

    await page.keyboard.press(" ");
    await page.waitForTimeout(600);
    await page.keyboard.press(" ");

    const after = await page.locator("#timeline .activity-timer-row").first().textContent();
    expect(after).not.toBe(before);
  });

  // ── Statistics ─────────────────────────────────────────────────────────────

  test("AR event is counted as red passivity in statistics", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);
    await recordEventAtTime(page, "2:40", ["P", "R"]); // recorded as AR

    const exportData = await generateExport(page);
    expect(exportData.bout.summary.statistics.red.passivity).toBe(2);
  });

  test("AB event is counted as blue passivity in statistics", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "B"]);
    await recordEventAtTime(page, "2:40", ["P", "B"]); // recorded as AB

    const exportData = await generateExport(page);
    expect(exportData.bout.summary.statistics.blue.passivity).toBe(2);
  });

  // ── Button click ───────────────────────────────────────────────────────────

  test("PR button records AR on 2nd red passivity", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator('#event-buttons-red .event-btn', { hasText: 'PR' }).click();
    await page.locator('#event-buttons-red .event-btn', { hasText: 'PR' }).click();

    const events = await generateExport(page).then(d => d.bout.events);
    const passivityEvents = events.filter(e => e.eventType === "PR" || e.eventType === "AR");
    expect(passivityEvents[1]?.eventType).toBe("AR");
  });

});
