import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet, recordEventAtTime } from "./helpers.js";

// ── Completion Form: Total Bout Time Field ───────────────────────────────────

test.describe("CHAMP Protocol - Completion Bout Time", () => {
  test("bout-time-button is visible in New mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("#bout-time-button")).toBeVisible();
  });

  test("bout-time-button is visible in Recording mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await expect(page.locator("#bout-time-button")).toBeVisible();
  });

  test("bout-time-button disappears when entering Completing mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");
    await expect(page.locator("#bout-time-button")).not.toBeVisible();
  });

  test("bout-time-button remains hidden in Completed mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await page.keyboard.press("F4"); // → Completing
    await page.selectOption("#compl-winner", "red");
    await page.keyboard.press("F4"); // → Completed
    await expect(page.locator("#release-complete-button")).toContainText("Korrigieren");
    await expect(page.locator("#bout-time-button")).not.toBeVisible();
  });

  test("compl-bout-time field is not visible in New mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("#compl-bout-time")).not.toBeVisible();
  });

  test("compl-bout-time field is not visible in Recording mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await expect(page.locator("#compl-bout-time")).not.toBeVisible();
  });

  test("compl-bout-time field appears with elapsed bout time when entering Completing", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    // Record a point at 2:50 remaining → elapsed = 3:00 - 2:50 = 0:10
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await page.keyboard.press("F4"); // → Completing
    await expect(page.locator("#compl-bout-time")).toBeVisible();
    // Elapsed time = 10 seconds → "0:10"
    await expect(page.locator("#compl-bout-time")).toHaveValue("0:10");
  });

  test("compl-bout-time field is visible and disabled in Completed mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await page.keyboard.press("F4"); // → Completing
    await page.selectOption("#compl-winner", "red");
    await page.keyboard.press("F4"); // → Completed
    await expect(page.locator("#compl-bout-time")).toBeVisible();
    await expect(page.locator("#compl-bout-time")).toBeDisabled();
  });

  test("compl-bout-time field is visible and editable when re-released", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await page.keyboard.press("F4"); // → Completing
    await page.selectOption("#compl-winner", "red");
    await page.keyboard.press("F4"); // → Completed
    await page.keyboard.press("F4"); // → Re-released
    await expect(page.locator("#compl-bout-time")).toBeVisible();
    await expect(page.locator("#compl-bout-time")).not.toBeDisabled();
  });

  test("compl-bout-time shows error for invalid format", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    await page.fill("#compl-bout-time", "abc");
    await page.keyboard.press("F4"); // try to complete
    await expect(page.locator("#compl-bout-time-error")).toBeVisible();
    // Should remain in Completing mode
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");
  });

  test("compl-bout-time shows error when exceeding max total time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    // Default ruleset: [180, 180] = 360 seconds = 6:00 max
    await page.fill("#compl-bout-time", "6:01");
    await page.keyboard.press("F4"); // try to complete
    await expect(page.locator("#compl-bout-time-error")).toBeVisible();
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");
  });

  test("compl-bout-time exactly at max total time is accepted", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    // Max is 6:00 (360 seconds)
    await page.fill("#compl-bout-time", "6:00");
    await page.keyboard.press("F4"); // complete
    await expect(page.locator("#release-complete-button")).toContainText("Korrigieren");
  });

  test("compl-bout-time 0:00 is accepted", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    await page.fill("#compl-bout-time", "0:00");
    await page.keyboard.press("F4"); // complete
    await expect(page.locator("#release-complete-button")).toContainText("Korrigieren");
  });

  test("compl-bout-time error clears when value corrected", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    await page.fill("#compl-bout-time", "6:01");
    await page.keyboard.press("F4"); // trigger validation error
    await expect(page.locator("#compl-bout-time-error")).toBeVisible();
    await page.fill("#compl-bout-time", "3:00");
    await expect(page.locator("#compl-bout-time-error")).not.toBeVisible();
  });

  test("compl-bout-time field resets on page reload", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    await page.goto(BASE_URL);
    // After reload, field should be hidden and empty
    await expect(page.locator("#compl-bout-time")).not.toBeVisible();
  });

  test("completion form uses single-column layout at narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 600 });
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing (shows compl-bout-time-row)
    // Check that all items are stacked vertically (single column)
    const boutTimeBox = await page.locator("#compl-bout-time-row").boundingBox();
    const winnerBox = await page.locator("#compl-winner").boundingBox();
    const victoryBox = await page.locator("#compl-victory-type").boundingBox();
    const pointsBox = await page.locator(".compl-points-row").boundingBox();
    expect(boutTimeBox).not.toBeNull();
    expect(winnerBox).not.toBeNull();
    expect(victoryBox).not.toBeNull();
    expect(pointsBox).not.toBeNull();
    // In single-column layout, items are stacked top-to-bottom
    expect(winnerBox.y).toBeGreaterThan(boutTimeBox.y);
    expect(victoryBox.y).toBeGreaterThan(winnerBox.y);
    expect(pointsBox.y).toBeGreaterThan(victoryBox.y);
    // They should all have the same x (all full width)
    expect(Math.abs(boutTimeBox.x - winnerBox.x)).toBeLessThan(5);
    expect(Math.abs(winnerBox.x - victoryBox.x)).toBeLessThan(5);
  });

  test("completion form uses two-column layout at wide viewport", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 });
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing (shows compl-bout-time-row)
    // At wide viewport: bout-time|winner in row 1, victory-type|points in row 2
    const boutTimeBox = await page.locator("#compl-bout-time-row").boundingBox();
    const winnerBox = await page.locator("#compl-winner").boundingBox();
    const victoryBox = await page.locator("#compl-victory-type").boundingBox();
    const pointsBox = await page.locator(".compl-points-row").boundingBox();
    expect(boutTimeBox).not.toBeNull();
    expect(winnerBox).not.toBeNull();
    expect(victoryBox).not.toBeNull();
    expect(pointsBox).not.toBeNull();
    // Row 1: bout-time and winner share the same Y (side by side)
    expect(Math.abs(boutTimeBox.y - winnerBox.y)).toBeLessThan(5);
    // bout-time is left of winner
    expect(boutTimeBox.x).toBeLessThan(winnerBox.x);
    // Row 2: victory-type and points share the same Y (side by side)
    expect(Math.abs(victoryBox.y - pointsBox.y)).toBeLessThan(5);
    // victory-type is left of points
    expect(victoryBox.x).toBeLessThan(pointsBox.x);
    // Row 2 is below row 1
    expect(victoryBox.y).toBeGreaterThan(winnerBox.y);
  });
});
