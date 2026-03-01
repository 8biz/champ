import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet, nextEventBox } from "./helpers.js";

// ── Space with partially-filled key buffer ────────────────────────────────────
//
// Regression tests for: "Starting or stopping bout time does not work, when
// key sequence buffer is filled partially."
//
// Requirements:
//   • Space toggles the timer regardless of buffer state.
//   • Space does NOT clear the key sequence buffer.
//   • B + Space + 1 results in event 1B (buffer survives the Space press).
//   • F4 works when the buffer is partially filled.

test.describe("Space with partial key buffer", () => {
  test("Space stops the timer when buffer has 'R'", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Start the timer
    await page.keyboard.press(" ");
    await page.waitForTimeout(300);

    // Partially fill the buffer with 'R'
    await page.keyboard.press("r");
    await expect(nextEventBox(page)).toHaveText("R");

    // Press Space – timer should stop; buffer should still show 'R'
    await page.keyboard.press(" ");
    const stoppedTime = await page.locator("#bout-time-display").textContent();
    await page.waitForTimeout(600);
    await expect(page.locator("#bout-time-display")).toHaveText(stoppedTime);

    // Buffer should be unchanged
    await expect(nextEventBox(page)).toHaveText("R");
  });

  test("Space starts the timer when buffer has '2'", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Partially fill the buffer with '2' (timer is stopped)
    await page.keyboard.press("2");
    await expect(nextEventBox(page)).toHaveText("2");

    // Press Space – timer should start; buffer should still show '2'
    await page.keyboard.press(" ");
    const timeAfterStart = await page.locator("#bout-time-display").textContent();
    await page.waitForTimeout(600);
    const timeAfterWait = await page.locator("#bout-time-display").textContent();
    expect(timeAfterStart).not.toBe(timeAfterWait);

    // Buffer should be unchanged
    await expect(nextEventBox(page)).toHaveText("2");
  });

  test("B + Space + 1 records event 1B", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Press B to start a sequence
    await page.keyboard.press("b");
    await expect(nextEventBox(page)).toHaveText("B");

    // Press Space – timer starts, buffer keeps 'B'
    await page.keyboard.press(" ");
    await expect(nextEventBox(page)).toHaveText("B");

    // Press 1 to complete the sequence
    await page.keyboard.press("1");
    await expect(page.locator("#score-blue")).toHaveText("1");
    await expect(nextEventBox(page)).toHaveText("+");
  });

  test("F4 works when buffer is partially filled", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Partially fill the buffer with 'R'
    await page.keyboard.press("r");
    await expect(nextEventBox(page)).toHaveText("R");

    // Press F4 – should transition to Completing state
    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");
  });
});
