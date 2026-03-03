import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet } from "./helpers.js";

// ── Time Modification via Right-Click / Long-Press ──────────────────────────

test.describe("CHAMP Protocol - Time Modification via Mouse/Touch", () => {

  // ── Right-click on bout-time button ───────────────────────────────────────

  test("Right-click on bout-time button opens time modification modal", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();

    await page.locator("#bout-time-button").click({ button: "right" });

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("Right-click on bout-time button does not open modal in New (idle) mode", async ({ page }) => {
    await page.goto(BASE_URL);

    // Button is disabled in New mode; dispatch contextmenu event directly to verify handler guards
    await page.locator("#bout-time-button").dispatchEvent("contextmenu");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
  });

  test("Right-click on bout-time button does not open modal while timer is running", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press(" ");

    await page.locator("#bout-time-button").click({ button: "right" });

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();

    // Stop timer for cleanup
    await page.keyboard.press(" ");
  });

  test("Right-click on bout-time button pre-fills modal with current time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator("#bout-time-button").click({ button: "right" });

    await expect(page.locator("#time-mod-input")).toHaveValue("3:00");
    await page.locator("#time-mod-cancel").click();
  });

  // ── Right-click on injury/blood mini-time buttons ─────────────────────────

  test("Right-click on injury-time-red opens modification modal for IR", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();

    await page.locator("#injury-time-red").click({ button: "right" });

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("Right-click on injury-time-blue opens modification modal for IB", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator("#injury-time-blue").click({ button: "right" });

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("Right-click on blood-time-red opens modification modal for BR", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator("#blood-time-red").click({ button: "right" });

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("Right-click on blood-time-blue opens modification modal for BB", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator("#blood-time-blue").click({ button: "right" });

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("Right-click on injury-time-red does not open modal in New (idle) mode", async ({ page }) => {
    await page.goto(BASE_URL);

    // Button is disabled in New mode; dispatch contextmenu event directly to verify handler guards
    await page.locator("#injury-time-red").dispatchEvent("contextmenu");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
  });

  test("Right-click on injury-time-red modal is pre-filled with 0:00 initially", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator("#injury-time-red").click({ button: "right" });

    await expect(page.locator("#time-mod-input")).toHaveValue("0:00");
    await page.locator("#time-mod-cancel").click();
  });

  test("Confirming via right-click modal updates the bout time display", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator("#bout-time-button").click({ button: "right" });
    await page.locator("#time-mod-input").fill("2:30");
    await page.locator("#time-mod-confirm").click();

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    await expect(page.locator("#bout-time-display")).toHaveText("2:30");
  });

  test("Confirming via right-click on injury-time-red updates the timer display", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator("#injury-time-red").click({ button: "right" });
    await page.locator("#time-mod-input").fill("1:00");
    await page.locator("#time-mod-input").press("Enter");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    await expect(page.locator("#injury-time-red")).toContainText("1:00");
  });
});
