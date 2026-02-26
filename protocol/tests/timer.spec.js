import { test, expect } from "@playwright/test";

const BASE_URL = "file://" + process.cwd() + "/protocol/protocol.html";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Release the scoresheet for recording (F4 from New → Recording). */
async function releaseScoresheet(page) {
  await page.keyboard.press("F4");
}

// ── Timer (Real Timer) ──────────────────────────────────────────────────────

test.describe("CHAMP Protocol - Timer", () => {
  test("Timer starts and counts down with Space key", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await expect(page.locator("#bout-time-display")).toHaveText("3:00");

    await page.keyboard.press(" ");
    await page.waitForTimeout(1100);

    const currentTime = await page.locator("#bout-time-display").textContent();
    const [min, sec] = currentTime.split(':').map(s => parseInt(s));
    const totalSeconds = min * 60 + sec;
    expect(totalSeconds).toBeLessThan(180);
    expect(totalSeconds).toBeGreaterThan(176);
  });

  test("Timer stops with Space key", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press(" ");
    await page.waitForTimeout(600);
    await page.keyboard.press(" ");

    const stoppedTime = await page.locator("#bout-time-display").textContent();
    await page.waitForTimeout(1100);
    await expect(page.locator("#bout-time-display")).toHaveText(stoppedTime);
  });

  test("Hidden test hooks work correctly", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("#bout-time-display")).toHaveText("3:00");

    await page.locator("#start").click({ force: true });
    await page.waitForTimeout(1200);

    const timeAfterStart = await page.locator("#bout-time-display").textContent();
    const [min, sec] = timeAfterStart.split(':').map(s => parseInt(s));
    expect(min * 60 + sec).toBeLessThan(180);
    expect(min * 60 + sec).toBeGreaterThan(176);

    await page.locator("#stop").click({ force: true });
    const stoppedTime = await page.locator("#bout-time-display").textContent();
    await page.waitForTimeout(1200);
    await expect(page.locator("#bout-time-display")).toHaveText(stoppedTime);
  });

  test("Spacebar after clicking event button does not repeat event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator('#event-buttons-red .event-btn', { hasText: '[1R]' }).click();
    await expect(page.locator("#score-red")).toHaveText("1");

    const entries = page.locator('.timeline .entry:not(#next-event)');
    await expect(entries).toHaveCount(1);

    await page.keyboard.press(" ");
    await page.waitForTimeout(350);
    await page.keyboard.press(" ");

    await expect(page.locator('#bout-time-display')).not.toHaveAttribute('data-fraction', '0');
    await expect(page.locator("#score-red")).toHaveText("1");
    await expect(entries).toHaveCount(1);
  });

  test("Spacebar after clicking release button starts timer, not Completing", async ({ page }) => {
    await page.goto(BASE_URL);

    await page.locator('#release-complete-button').click();
    await expect(page.locator('#compl-winner')).toBeDisabled();

    await page.keyboard.press(" ");
    await page.waitForTimeout(350);
    await page.keyboard.press(" ");

    await expect(page.locator('#bout-time-display')).not.toHaveAttribute('data-fraction', '0');
    await expect(page.locator('#compl-winner')).toBeDisabled();
    await expect(page.locator('#release-complete-button')).toContainText('Fertigstellen');
  });
});
