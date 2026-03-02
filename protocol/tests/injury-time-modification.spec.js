import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet } from "./helpers.js";

// ── Injury Time Modification Mode (T+R+, / T+B+, / T+R+. / T+B+.) ───────────

test.describe("CHAMP Protocol - Injury Time Modification", () => {

  // ── Opening the modal ──────────────────────────────────────────────────────

  test("T+R+, opens time modification modal for Red injury time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();

    await page.keyboard.press("t");
    await page.keyboard.press("r");
    await page.keyboard.press(",");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("T+,+R also opens modal for Red injury time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press(",");
    await page.keyboard.press("r");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("T+B+, opens time modification modal for Blue injury time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("b");
    await page.keyboard.press(",");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("T+R+. opens time modification modal for Red blood time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("r");
    await page.keyboard.press(".");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("T+B+. opens time modification modal for Blue blood time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("b");
    await page.keyboard.press(".");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("Injury time modal does not open in New (idle) mode", async ({ page }) => {
    await page.goto(BASE_URL);
    // Do NOT release scoresheet

    await page.keyboard.press("t");
    await page.keyboard.press("r");
    await page.keyboard.press(",");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
  });

  // ── Pre-fill values ────────────────────────────────────────────────────────

  test("IR modal is pre-filled with current injury timer value (0:00 initially)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("r");
    await page.keyboard.press(",");

    await expect(page.locator("#time-mod-input")).toHaveValue("0:00");
    await page.locator("#time-mod-cancel").click();
  });

  test("IR modal is pre-filled with current elapsed injury time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Set IR time to 30 seconds
    await page.evaluate(() => window.testHelper.setInjuryTime100ms('IR', 300));

    await page.keyboard.press("t");
    await page.keyboard.press("r");
    await page.keyboard.press(",");

    await expect(page.locator("#time-mod-input")).toHaveValue("0:30");
    await page.locator("#time-mod-cancel").click();
  });

  // ── Cancel behaviour ───────────────────────────────────────────────────────

  test("Escape closes injury time modal without changing time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.evaluate(() => window.testHelper.setInjuryTime100ms('IR', 300));

    await page.keyboard.press("t");
    await page.keyboard.press("r");
    await page.keyboard.press(",");
    await expect(page.locator("#time-mod-modal")).toBeVisible();

    await page.locator("#time-mod-input").press("Escape");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    // Timer value should remain 300 (0:30)
    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.IR.time100ms).toBe(300);
  });

  test("Cancel button closes modal without changing injury time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.evaluate(() => window.testHelper.setInjuryTime100ms('IR', 300));

    await page.keyboard.press("t");
    await page.keyboard.press("r");
    await page.keyboard.press(",");
    await page.locator("#time-mod-cancel").click();

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.IR.time100ms).toBe(300);
  });

  // ── Confirming changes ─────────────────────────────────────────────────────

  test("Confirming a valid time updates the Red injury timer display", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("r");
    await page.keyboard.press(",");
    await page.locator("#time-mod-input").fill("1:00");
    await page.locator("#time-mod-input").press("Enter");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    await expect(page.locator("#injury-time-red")).toContainText("1:00");
  });

  test("Confirming records T_IR_Modified event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.evaluate(() => window.testHelper.setInjuryTime100ms('IR', 300));

    await page.keyboard.press("t");
    await page.keyboard.press("r");
    await page.keyboard.press(",");
    await page.locator("#time-mod-input").fill("1:00");
    await page.locator("#time-mod-confirm").click();

    const events = await page.evaluate(() => window.exportHelper.generate().bout.events);
    const modEvent = events.find(e => e.eventType === "T_IR_Modified");
    expect(modEvent).toBeDefined();
    expect(modEvent.boutTime100ms).toBe(300);  // old value
    expect(modEvent.newTime).toBe(600);         // new value (60s)
  });

  test("Confirming records T_IB_Modified event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("b");
    await page.keyboard.press(",");
    await page.locator("#time-mod-input").fill("0:45");
    await page.locator("#time-mod-confirm").click();

    const events = await page.evaluate(() => window.exportHelper.generate().bout.events);
    const modEvent = events.find(e => e.eventType === "T_IB_Modified");
    expect(modEvent).toBeDefined();
    expect(modEvent.newTime).toBe(450); // 45s = 450 × 100ms
  });

  test("Confirming records T_BR_Modified event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("r");
    await page.keyboard.press(".");
    await page.locator("#time-mod-input").fill("2:00");
    await page.locator("#time-mod-confirm").click();

    const events = await page.evaluate(() => window.exportHelper.generate().bout.events);
    const modEvent = events.find(e => e.eventType === "T_BR_Modified");
    expect(modEvent).toBeDefined();
    expect(modEvent.newTime).toBe(1200); // 120s = 1200 × 100ms
  });

  test("Confirming records T_BB_Modified event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("b");
    await page.keyboard.press(".");
    await page.locator("#time-mod-input").fill("1:30");
    await page.locator("#time-mod-confirm").click();

    const events = await page.evaluate(() => window.exportHelper.generate().bout.events);
    const modEvent = events.find(e => e.eventType === "T_BB_Modified");
    expect(modEvent).toBeDefined();
    expect(modEvent.newTime).toBe(900); // 90s = 900 × 100ms
  });

  test("T+,+R also records T_IR_Modified event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press(",");
    await page.keyboard.press("r");
    await page.locator("#time-mod-input").fill("0:10");
    await page.locator("#time-mod-confirm").click();

    const events = await page.evaluate(() => window.exportHelper.generate().bout.events);
    expect(events.find(e => e.eventType === "T_IR_Modified")).toBeDefined();
  });

  // ── Validation ────────────────────────────────────────────────────────────

  test("Invalid format shows error and keeps modal open", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("r");
    await page.keyboard.press(",");
    await page.locator("#time-mod-input").fill("abc");
    await page.locator("#time-mod-input").press("Enter");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await expect(page.locator("#time-mod-error")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("Time exceeding max injury time shows error", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Default max injury time is 120s = 2:00
    await page.keyboard.press("t");
    await page.keyboard.press("r");
    await page.keyboard.press(",");
    await page.locator("#time-mod-input").fill("3:00");
    await page.locator("#time-mod-input").press("Enter");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await expect(page.locator("#time-mod-error")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("Max injury time (2:00) is accepted for IR", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("r");
    await page.keyboard.press(",");
    await page.locator("#time-mod-input").fill("2:00");
    await page.locator("#time-mod-input").press("Enter");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.injuryTimers.IR.time100ms).toBe(1200);
  });

  // ── TT (bout time) still works ─────────────────────────────────────────────

  test("TT still opens bout time modification modal", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await expect(page.locator("#time-mod-input")).toHaveValue("3:00");
    await page.locator("#time-mod-cancel").click();
  });

  // ── Injury timer can be modified while running ────────────────────────────

  test("Injury timer can be modified while running", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Start IR
    await page.keyboard.press("r");
    await page.keyboard.press(",");
    const stateBefore = await page.evaluate(() => window.testHelper.getState());
    expect(stateBefore.injuryTimers.IR.running).toBe(true);

    // Modify IR time
    await page.keyboard.press("t");
    await page.keyboard.press("r");
    await page.keyboard.press(",");
    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-input").fill("0:30");
    await page.locator("#time-mod-confirm").click();

    const stateAfter = await page.evaluate(() => window.testHelper.getState());
    expect(stateAfter.injuryTimers.IR.time100ms).toBe(300);

    // Cleanup
    await page.keyboard.press("r");
    await page.keyboard.press(",");
  });
});
