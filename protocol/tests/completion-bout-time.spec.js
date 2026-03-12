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

  test("compl-bout-time field is always disabled", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    await expect(page.locator("#compl-bout-time")).toBeDisabled();
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

  test("compl-bout-time field is visible and disabled when re-released", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await page.keyboard.press("F4"); // → Completing
    await page.selectOption("#compl-winner", "red");
    await page.keyboard.press("F4"); // → Completed
    await page.keyboard.press("F4"); // → Re-released
    await expect(page.locator("#compl-bout-time")).toBeVisible();
    await expect(page.locator("#compl-bout-time")).toBeDisabled();
  });

  test("clicking compl-bout-time-row in Completing mode opens time-mod modal", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    await page.click("#compl-bout-time-row");
    await expect(page.locator("#time-mod-modal")).toBeVisible();
  });

  test("time-mod modal for completion bout time is pre-filled with current bout time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]); // elapsed = 0:10
    await page.keyboard.press("F4"); // → Completing
    await page.click("#compl-bout-time-row");
    await expect(page.locator("#time-mod-input")).toHaveValue("0:10");
  });

  test("time-mod modal for completion bout time shows correct title", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    await page.click("#compl-bout-time-row");
    await expect(page.locator("#time-mod-title")).toContainText("Gesamtkampfzeit");
  });

  test("time-mod modal rejects invalid format for completion bout time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    await page.click("#compl-bout-time-row");
    await page.fill("#time-mod-input", "abc");
    await page.click("#time-mod-confirm");
    // Modal stays open, error shown
    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await expect(page.locator("#time-mod-error")).toBeVisible();
  });

  test("time-mod modal rejects completion bout time exceeding max total time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    await page.click("#compl-bout-time-row");
    // Default ruleset: [180, 180] = 360 seconds = 6:00 max
    await page.fill("#time-mod-input", "6:01");
    await page.click("#time-mod-confirm");
    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await expect(page.locator("#time-mod-error")).toBeVisible();
  });

  test("time-mod modal accepts valid completion bout time and updates display", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    await page.click("#compl-bout-time-row");
    await page.fill("#time-mod-input", "3:00");
    await page.click("#time-mod-confirm");
    // Modal closes, field updated
    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    await expect(page.locator("#compl-bout-time")).toHaveValue("3:00");
  });

  test("time-mod modal accepts 0:00 as completion bout time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    await page.click("#compl-bout-time-row");
    await page.fill("#time-mod-input", "0:00");
    await page.click("#time-mod-confirm");
    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    await expect(page.locator("#compl-bout-time")).toHaveValue("0:00");
  });

  test("time-mod modal accepts max total bout time (6:00)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    await page.click("#compl-bout-time-row");
    await page.fill("#time-mod-input", "6:00");
    await page.click("#time-mod-confirm");
    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    await expect(page.locator("#compl-bout-time")).toHaveValue("6:00");
  });

  test("updated completion bout time is used when completing", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing
    // Change bout time via modal
    await page.click("#compl-bout-time-row");
    await page.fill("#time-mod-input", "3:00");
    await page.click("#time-mod-confirm");
    await page.selectOption("#compl-winner", "red");
    await page.keyboard.press("F4"); // → Completed
    // Should reach Completed state
    await expect(page.locator("#release-complete-button")).toContainText("Korrigieren");
    await expect(page.locator("#compl-bout-time")).toHaveValue("3:00");
  });

  test("clicking compl-bout-time-row in Completed mode does NOT open modal", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await page.keyboard.press("F4"); // → Completing
    await page.selectOption("#compl-winner", "red");
    await page.keyboard.press("F4"); // → Completed
    await page.click("#compl-bout-time-row");
    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
  });

  test("clicking compl-bout-time-row in Re-released mode opens time-mod modal", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await page.keyboard.press("F4"); // → Completing
    await page.selectOption("#compl-winner", "red");
    await page.keyboard.press("F4"); // → Completed
    await page.keyboard.press("F4"); // → Re-released
    await page.click("#compl-bout-time-row");
    await expect(page.locator("#time-mod-modal")).toBeVisible();
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
