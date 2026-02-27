import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet, setBoutTime, recordEventAtTime } from "./helpers.js";

// ── Event Recording ─────────────────────────────────────────────────────────

test.describe("CHAMP Protocol - Event Recording", () => {
  test("Record point event 1B with keyboard", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["1", "B"]);

    await expect(page.locator("#score-blue")).toHaveText("1");
    await expect(page.locator("#timeline .entry-box").first()).toContainText("1B");
  });

  test("Record point event 4R with keyboard (reverse order)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Letter-first ordering: R then 4
    await recordEventAtTime(page, "2:50", ["R", "4"]);

    await expect(page.locator("#score-red")).toHaveText("4");
    await expect(page.locator("#timeline .entry-box").first()).toContainText("4R");
  });

  test("Multiple events update scores correctly", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);
    await recordEventAtTime(page, "2:30", ["4", "R"]);
    await recordEventAtTime(page, "2:20", ["1", "B"]);

    await expect(page.locator("#score-red")).toHaveText("5");  // 1 + 4
    await expect(page.locator("#score-blue")).toHaveText("3"); // 2 + 1
  });

  test("Passivity events are recorded", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["P", "R"]);

    await expect(page.locator("#timeline .entry-box").first()).toContainText("PR");
  });

  test("Caution events update scores correctly", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Red caution, Blue +1 (0R1B)
    await recordEventAtTime(page, "2:50", ["R", "0", "1"]);

    await expect(page.locator("#score-blue")).toHaveText("1");
    await expect(page.locator("#timeline .entry-box.caution").first()).toBeVisible();
  });

  test("Event buttons work correctly when clicked", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator('#event-buttons-red .event-btn', { hasText: '[1R]' }).click();
    await expect(page.locator("#score-red")).toHaveText("1");
    await expect(page.locator("#score-blue")).toHaveText("0");

    await page.locator('#event-buttons-blue .event-btn', { hasText: '[2B]' }).click();
    await expect(page.locator("#score-red")).toHaveText("1");
    await expect(page.locator("#score-blue")).toHaveText("2");

    await page.locator('#event-buttons-red .event-btn', { hasText: '[4R]' }).click();
    await expect(page.locator("#score-red")).toHaveText("5");

    await page.locator('#event-buttons-blue .event-btn', { hasText: '[5B]' }).click();
    await expect(page.locator("#score-blue")).toHaveText("7");

    await expect(page.locator('.timeline .entry:not(#next-event)')).toHaveCount(4);
  });

  test("Passivity buttons work when clicked", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator('#event-buttons-red .event-btn', { hasText: '[PR]' }).click();
    await page.locator('#event-buttons-blue .event-btn', { hasText: '[PB]' }).click();

    const entries = page.locator('.timeline .entry:not(#next-event)');
    await expect(entries).toHaveCount(2);
    await expect(entries.nth(0).locator('.entry-box')).toHaveText("PR");
    await expect(entries.nth(1).locator('.entry-box')).toHaveText("PB");
  });

  test("Caution buttons send full key sequence", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // 0R1B: Red caution, Blue +1
    await page.locator('#event-buttons-red .event-btn', { hasText: '[0R1B]' }).click();
    await expect(page.locator("#score-red")).toHaveText("0");
    await expect(page.locator("#score-blue")).toHaveText("1");

    const entries = page.locator('.timeline .entry:not(#next-event)');
    await expect(entries).toHaveCount(1);
    await expect(entries.nth(0).locator('.entry-box')).toHaveClass(/caution/);

    // 0B2R: Blue caution, Red +2
    await page.locator('#event-buttons-blue .event-btn', { hasText: '[0B2R]' }).click();
    await expect(page.locator("#score-red")).toHaveText("2");
    await expect(page.locator("#score-blue")).toHaveText("1");
    await expect(entries).toHaveCount(2);
  });
});
