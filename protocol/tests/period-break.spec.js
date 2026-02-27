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
});
