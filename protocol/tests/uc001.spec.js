import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet, setBoutTime, recordEventAtTime } from "./helpers.js";

// ── Core UI & Flow ──────────────────────────────────────────────────────────

test.describe("CHAMP Protocol - Core UI & Flow", () => {
  test("Initial state - Idle mode", async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page.locator("#bout-time-display")).toHaveText("3:00");
    await expect(page.locator("#score-red")).toHaveText("0");
    await expect(page.locator("#score-blue")).toHaveText("0");
    await expect(page.locator("#release-complete-button")).toContainText("Freigeben");
    await expect(page.locator("#next-event")).not.toBeVisible();
  });

  test("Release scoresheet with F4 key", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await expect(page.locator("#release-complete-button")).toContainText("Fertigstellen");
    await expect(page.locator("#next-event")).toBeVisible();
    await expect(page.locator("#bout-info")).toBeDisabled();
  });

  test("Complete use case UC001 - short bout", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["1", "B"]);
    await expect(page.locator("#score-blue")).toHaveText("1");

    await recordEventAtTime(page, "2:20", ["4", "R"]);
    await expect(page.locator("#score-red")).toHaveText("4");

    const boutEvents = page.locator("#timeline .entry-box").filter({ hasNotText: "+" });
    await expect(boutEvents).toHaveCount(2);
    await expect(boutEvents.nth(0)).toContainText("1B");
    await expect(boutEvents.nth(1)).toContainText("4R");
    await expect(page.locator("#next-event")).toBeVisible();

    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");
    await expect(page.locator("#completion-form")).toBeVisible();

    await page.selectOption("#compl-winner", "red");
    await page.keyboard.press("F4");

    await expect(page.locator("#release-complete-button")).toContainText("Korrigieren");
    await expect(page.locator("#compl-winner")).toBeDisabled();
  });

  test("Export functionality generates valid JSON", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await recordEventAtTime(page, "2:50", ["1", "B"]);

    const exportData = await page.evaluate(() => window.exportHelper.generate());

    expect(exportData).toHaveProperty("exportVersion");
    expect(exportData).toHaveProperty("metadata");
    expect(exportData).toHaveProperty("bout");
    expect(exportData.bout).toHaveProperty("header");
    expect(exportData.bout).toHaveProperty("summary");
    expect(exportData.bout).toHaveProperty("events");

    expect(exportData.bout.events.length).toBeGreaterThan(0);
    expect(exportData.bout.events[0].eventType).toBe("ScoresheetReleased");

    expect(exportData.bout.summary.scores.blue).toBe(1);
    expect(exportData.bout.summary.scores.red).toBe(0);

    expect(exportData.bout.summary.timeline.length).toBe(1);
    expect(exportData.bout.summary.timeline[0].eventType).toBe("1B");
  });

  test("Invalid key sequences are ignored", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("R");
    await page.keyboard.press("X");

    const boutEvents = page.locator("#timeline > div:not(#next-event) .entry-box");
    await expect(boutEvents).toHaveCount(0);

    await page.keyboard.press("1");
    await page.keyboard.press("R");
    await expect(page.locator("#score-red")).toHaveText("1");
  });

  test("Escape key clears key buffer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("R");
    await page.keyboard.press("Escape");

    await page.keyboard.press("1");
    await expect(page.locator("#score-red")).toHaveText("0");

    await page.keyboard.press("R");
    await expect(page.locator("#score-red")).toHaveText("1");
  });
});
