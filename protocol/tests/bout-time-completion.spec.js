import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet, recordEventAtTime } from "./helpers.js";

// ── Total Bout Time in Completion Form ──────────────────────────────────────

test.describe("CHAMP Protocol - Total Bout Time in Completion Form", () => {

  test("bout-time-button is disabled when entering Completing mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "R"]);

    // Verify bout-time-button is enabled in Recording mode
    await expect(page.locator("#bout-time-button")).not.toBeDisabled();

    // Enter Completing mode
    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");

    // bout-time-button must be disabled in Completing mode
    await expect(page.locator("#bout-time-button")).toBeDisabled();
  });

  test("event buttons remain enabled in Completing mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "R"]);

    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");

    // Event buttons must still be enabled in Completing mode
    const eventBtn = page.locator(".event-btn").first();
    await expect(eventBtn).not.toBeDisabled();
  });

  test("compl-bout-time field is present in the completion form", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("#compl-bout-time")).toBeVisible();
  });

  test("compl-bout-time is populated with elapsed bout time when entering Completing", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Record an event at 2:50 remaining → elapsed = 3:00 - 2:50 = 0:10
    await recordEventAtTime(page, "2:50", ["4", "R"]);

    // Enter Completing mode
    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");

    // compl-bout-time should show elapsed time (10 seconds = 0:10)
    await expect(page.locator("#compl-bout-time")).toHaveValue("0:10");
  });

  test("compl-bout-time field is enabled in Completing mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "R"]);

    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");

    await expect(page.locator("#compl-bout-time")).not.toBeDisabled();
  });

  test("compl-bout-time field is disabled in Completed mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "R"]);

    // Enter Completing mode
    await page.keyboard.press("F4");
    await page.selectOption("#compl-winner", "red");
    await page.selectOption("#compl-victory-type", { index: 1 });

    // Complete the bout
    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Korrigieren");

    await expect(page.locator("#compl-bout-time")).toBeDisabled();
  });

  test("compl-bout-time is visible in Completed mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "R"]);

    await page.keyboard.press("F4");
    await page.selectOption("#compl-winner", "red");
    await page.selectOption("#compl-victory-type", { index: 1 });
    await page.keyboard.press("F4");

    await expect(page.locator("#release-complete-button")).toContainText("Korrigieren");
    await expect(page.locator("#compl-bout-time")).toBeVisible();
  });

  test("compl-bout-time is enabled in Re-released mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "R"]);

    await page.keyboard.press("F4");
    await page.selectOption("#compl-winner", "red");
    await page.selectOption("#compl-victory-type", { index: 1 });
    await page.keyboard.press("F4");

    // Enter Re-released mode
    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");

    await expect(page.locator("#compl-bout-time")).not.toBeDisabled();
  });

  test("compl-bout-time shows correct value in Re-released mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "R"]);

    await page.keyboard.press("F4");
    await page.selectOption("#compl-winner", "red");
    await page.selectOption("#compl-victory-type", { index: 1 });
    await page.keyboard.press("F4");

    // Enter Re-released mode
    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");

    // compl-bout-time should show the same value as when completing
    await expect(page.locator("#compl-bout-time")).toHaveValue("0:10");
  });

  test("compl-bout-time shows invalid state for bad format", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "R"]);

    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");

    // Clear and type invalid format
    const field = page.locator("#compl-bout-time");
    await field.fill("abc");
    await field.dispatchEvent("input");

    await expect(field).toHaveClass(/invalid/);
  });

  test("compl-bout-time removes invalid state for valid format", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "R"]);

    await page.keyboard.press("F4");

    const field = page.locator("#compl-bout-time");
    // First make it invalid
    await field.fill("xyz");
    await field.dispatchEvent("input");
    await expect(field).toHaveClass(/invalid/);

    // Now fix it
    await field.fill("1:30");
    await field.dispatchEvent("input");
    await expect(field).not.toHaveClass(/invalid/);
  });

  test("compl-bout-time shows invalid state when time exceeds maximum", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "R"]);

    await page.keyboard.press("F4");

    const field = page.locator("#compl-bout-time");
    // Default ruleset has periodTimesInSeconds [180, 180] → max 360s = 6:00
    await field.fill("7:00");
    await field.dispatchEvent("input");

    await expect(field).toHaveClass(/invalid/);
  });

  test("compl-bout-time accepts time equal to maximum", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "R"]);

    await page.keyboard.press("F4");

    const field = page.locator("#compl-bout-time");
    // Max is 6:00 (360 seconds)
    await field.fill("6:00");
    await field.dispatchEvent("input");

    await expect(field).not.toHaveClass(/invalid/);
  });

  test("compl-bout-time is reset on page reload", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["4", "R"]);

    await page.keyboard.press("F4");
    await page.selectOption("#compl-winner", "red");
    await page.selectOption("#compl-victory-type", { index: 1 });
    await page.keyboard.press("F4");

    // Reload the page
    await page.goto(BASE_URL);

    // compl-bout-time should be empty/reset
    const value = await page.locator("#compl-bout-time").inputValue();
    expect(value).toBe("");
  });

  test("completion form has single-column layout on narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 600 });
    await page.goto(BASE_URL);

    const formColumns = await page.evaluate(() => {
      const form = document.getElementById("completion-form");
      return window.getComputedStyle(form).gridTemplateColumns;
    });
    // Single column: exactly one track
    const tracks = formColumns.trim().split(/\s+/);
    expect(tracks.length).toBe(1);
  });

  test("completion form has single-row layout on wide viewport (>660px)", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto(BASE_URL);

    const formColumns = await page.evaluate(() => {
      const form = document.getElementById("completion-form");
      return window.getComputedStyle(form).gridTemplateColumns;
    });
    // Single row: four columns
    const tracks = formColumns.trim().split(/\s+/);
    expect(tracks.length).toBe(4);
  });

});
