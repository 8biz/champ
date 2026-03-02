import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet } from "./helpers.js";

// ── Injury Time ─────────────────────────────────────────────────────────────

test.describe("CHAMP Protocol - Injury Timers", () => {

  // ── Red injury time (T_IR) via keyboard ──────────────────────────────────

  test("R+, starts red injury timer and records T_IR_Started", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("r");
    await page.keyboard.press(",");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.IR.running).toBe(true);

    const log = await page.evaluate(() =>
      window.exportHelper.generate().bout.events
    );
    const started = log.find(e => e.eventType === 'T_IR_Started');
    expect(started).toBeTruthy();
  });

  test(",+R also starts red injury timer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press(",");
    await page.keyboard.press("r");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.IR.running).toBe(true);
  });

  test("R+, again stops red injury timer and records T_IR_Stopped", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("r");
    await page.keyboard.press(",");
    await page.keyboard.press("r");
    await page.keyboard.press(",");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.IR.running).toBe(false);

    const log = await page.evaluate(() => window.exportHelper.generate().bout.events);
    const stopped = log.find(e => e.eventType === 'T_IR_Stopped');
    expect(stopped).toBeTruthy();
  });

  // ── Blue injury time (T_IB) ───────────────────────────────────────────────

  test("B+, starts blue injury timer and records T_IB_Started", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("b");
    await page.keyboard.press(",");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.IB.running).toBe(true);

    const log = await page.evaluate(() => window.exportHelper.generate().bout.events);
    expect(log.find(e => e.eventType === 'T_IB_Started')).toBeTruthy();
  });

  // ── Red blood time (T_BR) ─────────────────────────────────────────────────

  test("R+. starts red blood timer and records T_BR_Started", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("r");
    await page.keyboard.press(".");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.BR.running).toBe(true);

    const log = await page.evaluate(() => window.exportHelper.generate().bout.events);
    expect(log.find(e => e.eventType === 'T_BR_Started')).toBeTruthy();
  });

  test(".+R starts red blood timer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press(".");
    await page.keyboard.press("r");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.BR.running).toBe(true);
  });

  // ── Blue blood time (T_BB) ────────────────────────────────────────────────

  test("B+. starts blue blood timer and records T_BB_Started", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("b");
    await page.keyboard.press(".");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.BB.running).toBe(true);

    const log = await page.evaluate(() => window.exportHelper.generate().bout.events);
    expect(log.find(e => e.eventType === 'T_BB_Started')).toBeTruthy();
  });

  // ── Interlocking constraints ───────────────────────────────────────────────

  test("Injury timer cannot start when bout time is running", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Start bout timer
    await page.keyboard.press(" ");
    const stateAfterStart = await page.evaluate(() => window.testHelper.getState());
    expect(stateAfterStart.timerRunning).toBe(true);

    // Try to start injury timer
    await page.keyboard.press("r");
    await page.keyboard.press(",");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.IR.running).toBe(false);

    // Stop bout timer
    await page.keyboard.press(" ");
  });

  test("Bout time cannot start when injury timer is running", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Start injury timer
    await page.keyboard.press("r");
    await page.keyboard.press(",");
    const stateAfterInjury = await page.evaluate(() => window.testHelper.getState());
    expect(stateAfterInjury.injuryTimers.IR.running).toBe(true);

    // Try to start bout timer
    await page.keyboard.press(" ");
    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.timerRunning).toBe(false);

    // Cleanup
    await page.keyboard.press("r");
    await page.keyboard.press(",");
  });

  test("Starting BR while IR is running stops IR automatically", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Start IR
    await page.keyboard.press("r");
    await page.keyboard.press(",");
    const stateIR = await page.evaluate(() => window.testHelper.getState());
    expect(stateIR.injuryTimers.IR.running).toBe(true);

    // Start BR (should stop IR)
    await page.keyboard.press("r");
    await page.keyboard.press(".");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.IR.running).toBe(false);
    expect(state.injuryTimers.BR.running).toBe(true);

    // Cleanup
    await page.keyboard.press("r");
    await page.keyboard.press(".");
  });

  test("Red and blue injury timers run independently", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Start IR
    await page.keyboard.press("r");
    await page.keyboard.press(",");

    // Start IB
    await page.keyboard.press("b");
    await page.keyboard.press(",");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.IR.running).toBe(true);
    expect(state.injuryTimers.IB.running).toBe(true);

    // Cleanup
    await page.keyboard.press("r");
    await page.keyboard.press(",");
    await page.keyboard.press("b");
    await page.keyboard.press(",");
  });

  // ── Auto-stop at max time ─────────────────────────────────────────────────

  test("IR timer auto-stops when max injury time is reached", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Start IR
    await page.keyboard.press("r");
    await page.keyboard.press(",");

    // Set time close to max (default 120s = 1200 units; set to 1198 so 2 ticks away)
    await page.evaluate(() => window.testHelper.setInjuryTime100ms('IR', 1198));

    // Wait long enough for auto-stop
    await page.waitForTimeout(500);

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.IR.running).toBe(false);

    const log = await page.evaluate(() => window.exportHelper.generate().bout.events);
    expect(log.find(e => e.eventType === 'T_IR_Stopped')).toBeTruthy();
  });

  test("BR timer auto-stops when max blood time is reached", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Start BR
    await page.keyboard.press("r");
    await page.keyboard.press(".");

    // Set time close to max (default 240s = 2400 units)
    await page.evaluate(() => window.testHelper.setInjuryTime100ms('BR', 2398));

    await page.waitForTimeout(500);

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.BR.running).toBe(false);
  });

  // ── Timer display ─────────────────────────────────────────────────────────

  test("Injury timer button displays initial time TIR 0:00", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("#injury-time-red")).toContainText("TIR");
    await expect(page.locator("#injury-time-red")).toContainText("0:00");
  });

  test("Blood timer button displays initial time TBR 0:00", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("#blood-time-red")).toContainText("TBR");
    await expect(page.locator("#blood-time-red")).toContainText("0:00");
  });

  test("Injury timer button shows running class when active", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("r");
    await page.keyboard.press(",");

    await expect(page.locator("#injury-time-red")).toHaveClass(/running/);

    // Stop it
    await page.keyboard.press("r");
    await page.keyboard.press(",");

    await expect(page.locator("#injury-time-red")).not.toHaveClass(/running/);
  });

  test("Injury timer display updates as timer runs", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("r");
    await page.keyboard.press(",");

    await page.waitForTimeout(1200);

    const text = await page.locator("#injury-time-red").textContent();
    // Should no longer be 0:00 after 1+ seconds
    expect(text).not.toContain("0:00");

    // Cleanup
    await page.keyboard.press("r");
    await page.keyboard.press(",");
  });

  // ── Button click handlers ─────────────────────────────────────────────────

  test("Injury time button click starts timer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator("#injury-time-red").click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.IR.running).toBe(true);

    // Cleanup
    await page.locator("#injury-time-red").click();
  });

  test("Blood time button click starts timer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator("#blood-time-red").click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.BR.running).toBe(true);

    // Cleanup
    await page.locator("#blood-time-red").click();
  });

  test("Blue injury time button click starts timer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator("#injury-time-blue").click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.IB.running).toBe(true);

    // Cleanup
    await page.locator("#injury-time-blue").click();
  });

  // ── Statistics ────────────────────────────────────────────────────────────

  test("Injury time accumulates in statistics", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Start and stop IR
    await page.keyboard.press("r");
    await page.keyboard.press(",");
    await page.waitForTimeout(600);
    await page.keyboard.press("r");
    await page.keyboard.press(",");

    const exportData = await page.evaluate(() => window.exportHelper.generate());
    const redStats = exportData.bout.summary.statistics.red;
    expect(redStats.injuryTime100ms).toBeGreaterThan(0);
  });

  // ── Keyboard sequences not in recording mode are ignored ──────────────────

  test("Injury time keyboard sequences ignored in New state", async ({ page }) => {
    await page.goto(BASE_URL);
    // Do NOT release scoresheet → mode is 'New'

    await page.keyboard.press("r");
    await page.keyboard.press(",");

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.IR.running).toBe(false);
  });
});
