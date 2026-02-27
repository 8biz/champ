import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet } from "./helpers.js";

// ── Time Modification Mode (TT) ─────────────────────────────────────────────

test.describe("CHAMP Protocol - Time Modification Mode (TT)", () => {
  test("TT opens time modification modal in Recording mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
  });

  test("TT modal is pre-filled with current period time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-input")).toHaveValue("3:00");
  });

  test("TT does not open modal in New (idle) mode", async ({ page }) => {
    await page.goto(BASE_URL);

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
  });

  test("Escape closes the time modification modal without changing time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await expect(page.locator("#time-mod-modal")).toBeVisible();

    await page.locator("#time-mod-input").press("Escape");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    await expect(page.locator("#bout-time-display")).toHaveText("3:00");
  });

  test("Cancel button closes the modal without changing the time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await expect(page.locator("#time-mod-modal")).toBeVisible();

    await page.locator("#time-mod-cancel").click();

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    await expect(page.locator("#bout-time-display")).toHaveText("3:00");
  });

  test("Confirming a valid time updates the bout time display", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("2:30");
    await page.locator("#time-mod-input").press("Enter");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    await expect(page.locator("#bout-time-display")).toHaveText("2:30");
  });

  test("Confirming records a T_Modified event in the event log", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("2:00");
    await page.locator("#time-mod-confirm").click();

    const events = await page.evaluate(() => window.exportHelper.generate().bout.events);
    const modifiedEvent = events.find(e => e.eventType === "T_Modified");
    expect(modifiedEvent).toBeDefined();
    // 3:00 → 2:00 remaining ⇒ 60 s elapsed ⇒ 600 × 100 ms
    expect(modifiedEvent.newTime).toBe(600);
  });

  test("Time modification in period 2 produces cumulated boutTime", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Simulate period 1 fully elapsed: boutTime100ms = 1800, periodTime100ms = 1800 (new period)
    await page.evaluate(() => {
      window.testHelper.setBoutTime100ms(1800);
    });
    await page.evaluate(() => window.testHelper.triggerPeriodBreak(1));
    await page.waitForFunction(() => !window.testHelper.getState().breakTimerRunning);

    // Now in period 2: boutTime100ms = 1800, periodTime100ms = 1800
    // Modify time to 2:50 remaining in period 2
    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("2:50");
    await page.locator("#time-mod-confirm").click();

    const state = await page.evaluate(() => window.testHelper.getState());
    // Cumulated: 1800 (period 1) + 100 (10s into period 2) = 1900
    expect(state.boutTime100ms).toBe(1900);
  });

  test("Invalid time format shows error and keeps modal open", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("abc");
    await page.locator("#time-mod-input").press("Enter");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await expect(page.locator("#time-mod-error")).toBeVisible();
  });

  test("Entering time larger than period shows error and keeps modal open", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("4:00");
    await page.locator("#time-mod-input").press("Enter");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await expect(page.locator("#time-mod-error")).toBeVisible();
    await expect(page.locator("#bout-time-display")).toHaveText("3:00");
  });

  test("TT does not open modal while timer is running", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press(" ");

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
  });

  test("TT opens modal after timer is stopped", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press(" ");
    await page.waitForTimeout(200);
    await page.keyboard.press(" ");

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("TT works in Completing mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing

    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });
});
