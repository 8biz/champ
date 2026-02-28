import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet, recordEventAtTime } from "./helpers.js";

// ── Completion Form Reset on Reload ─────────────────────────────────────────

test.describe("CHAMP Protocol - Completion Form Reset", () => {
  test("Completion form is reset to defaults after page reload", async ({ page }) => {
    // Complete a bout
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["4", "R"]);

    // Enter Completing state
    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");

    // Fill in the completion form
    await page.selectOption("#compl-winner", "red");
    await page.selectOption("#compl-victory-type", { index: 1 });

    // Complete the bout
    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Korrigieren");

    // Reload the page to simulate starting a new bout
    await page.goto(BASE_URL);

    // Verify that completion form values are reset to defaults
    await expect(page.locator("#compl-winner")).toHaveValue("-");
    await expect(page.locator("#compl-victory-type")).toHaveValue("-");
    await expect(page.locator("#compl-points-red")).toHaveValue("0");
    await expect(page.locator("#compl-points-blue")).toHaveValue("0");

    // Verify no winner color class remains on the form
    await expect(page.locator("#completion-form")).not.toHaveClass(/winner-red/);
    await expect(page.locator("#completion-form")).not.toHaveClass(/winner-blue/);
  });
});
