import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet } from "./helpers.js";

// ── Period Break Timer ───────────────────────────────────────────────────────

test.describe("CHAMP Protocol - Period Break", () => {
  test("Period break starts automatically after PeriodEnd (not last period)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.evaluate(() => window.testHelper.triggerPeriodBreak(30));

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.breakTimerRunning).toBe(true);
    expect(state.currentPeriodIndex).toBe(1);
  });

  test("Period break UI: label changes to Kampfpause", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.evaluate(() => window.testHelper.triggerPeriodBreak(30));

    await expect(page.locator('#bout-time-button .time-label')).toHaveText('Kampfpause');
  });

  test("Period break UI: note changes to [Leertaste] → Abbruch", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.evaluate(() => window.testHelper.triggerPeriodBreak(30));

    await expect(page.locator('#bout-time-button .time-note')).toContainText('Abbruch');
  });

  test("Period break UI: bout-time-button has break-mode class (green background)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.evaluate(() => window.testHelper.triggerPeriodBreak(30));

    await expect(page.locator('#bout-time-button')).toHaveClass(/break-mode/);
  });

  test("Period break timer shows break countdown", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.evaluate(() => window.testHelper.triggerPeriodBreak(5));

    await expect(page.locator('#bout-time-display')).toHaveText('0:05');
  });

  test("Period break timer counts down", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.evaluate(() => window.testHelper.triggerPeriodBreak(5));
    await page.waitForTimeout(1100);

    const displayText = await page.locator('#bout-time-display').textContent();
    const [min, sec] = displayText.split(':').map(s => parseInt(s));
    expect(min * 60 + sec).toBeLessThan(5);
    expect(min * 60 + sec).toBeGreaterThanOrEqual(3);
  });

  test("Space key aborts period break", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.evaluate(() => window.testHelper.triggerPeriodBreak(30));

    let state = await page.evaluate(() => window.testHelper.getState());
    expect(state.breakTimerRunning).toBe(true);

    await page.keyboard.press(' ');

    state = await page.evaluate(() => window.testHelper.getState());
    expect(state.breakTimerRunning).toBe(false);
  });

  test("Clicking bout-time-button aborts period break", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.evaluate(() => window.testHelper.triggerPeriodBreak(30));

    await page.locator('#bout-time-button').click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.breakTimerRunning).toBe(false);
  });

  test("After break ends, next period time is loaded and UI restored", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.evaluate(() => window.testHelper.triggerPeriodBreak(30));
    await page.keyboard.press(' '); // abort break → next period time loaded

    await expect(page.locator('#bout-time-button')).not.toHaveClass(/break-mode/);
    await expect(page.locator('#bout-time-button .time-label')).toHaveText('Kampfzeit');
    await expect(page.locator('#bout-time-display')).toHaveText('3:00');
  });

  test("After break, user can start next period with Space", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.evaluate(() => window.testHelper.triggerPeriodBreak(30));
    await page.keyboard.press(' '); // abort break
    await page.keyboard.press(' '); // start next period timer

    await page.waitForTimeout(600);
    await page.keyboard.press(' '); // stop timer

    const timeStopped = await page.locator('#bout-time-display').textContent();
    const [min, sec] = timeStopped.split(':').map(s => parseInt(s));
    expect(min * 60 + sec).toBeLessThan(180);
    expect(min * 60 + sec).toBeGreaterThan(176);
  });

  test("Break auto-ends when timer reaches zero and restores next period", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.evaluate(() => window.testHelper.triggerPeriodBreak(1));
    await page.waitForTimeout(1200);

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.breakTimerRunning).toBe(false);

    await expect(page.locator('#bout-time-button .time-label')).toHaveText('Kampfzeit');
    await expect(page.locator('#bout-time-display')).toHaveText('3:00');
  });

  test("No break after last period", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Advance to last period: trigger period 1 end → abort break → period 2 loaded
    await page.evaluate(() => window.testHelper.triggerPeriodBreak(30));
    await page.keyboard.press(' '); // abort break, now in period 2 (index 1, the last)

    // Set minimal period time so the timer ends quickly
    await page.evaluate(() => window.testHelper.setPeriodTime100ms(1));

    // Start timer and wait for period end
    await page.keyboard.press(' ');
    await page.waitForTimeout(300);

    // Period 2 (last) ended – no break should have started
    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.breakTimerRunning).toBe(false);
    await expect(page.locator('#bout-time-button .time-label')).toHaveText('Kampfzeit');
  });

  test("Bout time button disabled after last period ends", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Advance to last period
    await page.evaluate(() => window.testHelper.triggerPeriodBreak(30));
    await page.keyboard.press(' '); // abort break → period 2

    // Set minimal period time so the timer ends quickly
    await page.evaluate(() => window.testHelper.setPeriodTime100ms(1));

    // Start timer and wait for period end
    await page.keyboard.press(' ');
    await page.waitForTimeout(300);

    await expect(page.locator('#bout-time-button')).toBeDisabled();
  });

  test("Timeline shows cumulated bout time across periods", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Simulate that period 1 ran for 1800 units (180 seconds):
    // event at 100 units (0:10.0) into period 1
    await page.evaluate(() => {
      window.testHelper.setBoutTime100ms(100);
      window.testHelper.setPeriodTime100ms(1700);
    });
    await page.keyboard.press('1');
    await page.keyboard.press('R');

    // Simulate period 1 ending at boutTime100ms = 1800
    await page.evaluate(() => {
      window.testHelper.setBoutTime100ms(1800);
      window.testHelper.setPeriodTime100ms(0);
    });
    await page.evaluate(() => window.testHelper.triggerPeriodBreak(30));
    await page.keyboard.press(' '); // abort break → period 2 loaded (boutTime100ms stays 1800)

    // Record an event at 100 units into period 2 (cumulated = 1900)
    await page.evaluate(() => {
      window.testHelper.setBoutTime100ms(1900);
    });
    await page.keyboard.press('2');
    await page.keyboard.press('B');

    // Parse timeline entry times
    const times = await page.evaluate(() => {
      const entries = document.querySelectorAll('.timeline .entry:not(#next-event) .entry-time');
      return Array.from(entries).map(el => el.textContent);
    });
    // Should have 3 entries: 1R, PeriodEnd, 2B
    expect(times.length).toBe(3);
    // 1R at 100 units → "0:10.0"
    expect(times[0]).toBe('0:10.0');
    // PeriodEnd at 1800 units → "3:00.0"
    expect(times[1]).toBe('3:00.0');
    // 2B at 1900 units → "3:10.0" (cumulated, not "0:10.0" which would be period-relative)
    expect(times[2]).toBe('3:10.0');
  });

  test("PeriodEnd shows period score not total score", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Record 4R in period 1
    await page.keyboard.press('4');
    await page.keyboard.press('R');

    // End period 1
    await page.evaluate(() => window.testHelper.triggerPeriodBreak(30));
    await page.keyboard.press(' '); // abort break → period 2

    // Record 2B in period 2
    await page.keyboard.press('2');
    await page.keyboard.press('B');

    // End period 2 by injecting event
    await page.evaluate(() => {
      window.testHelper.injectEvent({ eventType: 'PeriodEnd', boutTime100ms: 3600, sequence: 99 });
    });

    // Period 1 end entry should show 4:0 (only period 1 score)
    const periodEndEntries = page.locator('.timeline .entry-box.period-end');
    const firstPeriodEnd = periodEndEntries.nth(0);
    await expect(firstPeriodEnd.locator('.caution-row').last()).toContainText('4:0');

    // Period 2 end entry should show 0:2 (only period 2 score)
    const secondPeriodEnd = periodEndEntries.nth(1);
    await expect(secondPeriodEnd.locator('.caution-row').last()).toContainText('0:2');
  });
});
