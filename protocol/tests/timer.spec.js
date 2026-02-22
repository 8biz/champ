import { test, expect } from "@playwright/test";

const BASE_URL = "file://" + process.cwd() + "/protocol/protocol.html";

test.describe("CHAMP Protocol - UC001 Short Bout", () => {
  test("Initial state - Idle mode", async ({ page }) => {
    await page.goto(BASE_URL);

    // Check initial time display
    const boutTimeDisplay = page.locator("#bout-time-display");
    await expect(boutTimeDisplay).toHaveText("3:00");

    // Check initial scores
    const scoreRed = page.locator("#score-red");
    const scoreBlue = page.locator("#score-blue");
    await expect(scoreRed).toHaveText("0");
    await expect(scoreBlue).toHaveText("0");

    // Check Release button
    const releaseButton = page.locator("#release-complete-button");
    await expect(releaseButton).toContainText("Freigeben");

    // Check timeline is empty in Idle mode
    const timeline = page.locator("#timeline");
    const nextEvent = page.locator("#next-event");
    await expect(nextEvent).not.toBeVisible();
  });

  test("Release scoresheet with F4 key", async ({ page }) => {
    await page.goto(BASE_URL);

    // Press F4 to release
    await page.keyboard.press("F4");

    // Button should change to "Abschließen"
    const releaseButton = page.locator("#release-complete-button");
    await expect(releaseButton).toContainText("Abschließen");

    // Next-event should appear in timeline
    const nextEvent = page.locator("#next-event");
    await expect(nextEvent).toBeVisible();

    // Input fields should be disabled
    const boutInfo = page.locator("#bout-info");
    await expect(boutInfo).toBeDisabled();
  });

  test("Timer starts and counts down with Space key", async ({ page }) => {
    await page.goto(BASE_URL);

    // Release scoresheet
    await page.keyboard.press("F4");

    const boutTimeDisplay = page.locator("#bout-time-display");
    await expect(boutTimeDisplay).toHaveText("3:00");

    // Start timer with Space
    await page.keyboard.press(" ");
    await page.waitForTimeout(1100);

    // Time should have decreased (allow for timing variations)
    const currentTime = await boutTimeDisplay.textContent();
    const [min, sec] = currentTime.split(':').map(s => parseInt(s));
    const totalSeconds = min * 60 + sec;
    
    // Should be approximately 178-179 seconds (1-2 seconds elapsed)
    expect(totalSeconds).toBeLessThan(180);
    expect(totalSeconds).toBeGreaterThan(176);
  });

  test("Timer stops with Space key", async ({ page }) => {
    await page.goto(BASE_URL);

    // Release and start timer
    await page.keyboard.press("F4");
    await page.keyboard.press(" ");
    await page.waitForTimeout(600);

    // Stop timer
    await page.keyboard.press(" ");
    const stoppedTime = await page.locator("#bout-time-display").textContent();

    // Wait and verify time hasn't changed
    await page.waitForTimeout(1100);
    await expect(page.locator("#bout-time-display")).toHaveText(stoppedTime);
  });

  test("Record point event 1B with keyboard", async ({ page }) => {
    await page.goto(BASE_URL);

    // Release and start timer
    await page.keyboard.press("F4");
    await page.keyboard.press(" ");
    await page.waitForTimeout(200);

    // Record 1B event
    await page.keyboard.press("1");
    await page.keyboard.press("B");

    // Check score updated
    const scoreBlue = page.locator("#score-blue");
    await expect(scoreBlue).toHaveText("1");

    // Check timeline has event
    const timeline = page.locator("#timeline");
    const eventBoxes = timeline.locator(".entry-box");
    await expect(eventBoxes.first()).toContainText("1B");
  });

  test("Record point event 4R with keyboard (reverse order)", async ({ page }) => {
    await page.goto(BASE_URL);

    // Release and start timer
    await page.keyboard.press("F4");
    await page.keyboard.press(" ");
    await page.waitForTimeout(200);

    // Record 4R event (R then 4)
    await page.keyboard.press("R");
    await page.keyboard.press("4");

    // Check score updated
    const scoreRed = page.locator("#score-red");
    await expect(scoreRed).toHaveText("4");

    // Check timeline has event
    const timeline = page.locator("#timeline");
    const eventBoxes = timeline.locator(".entry-box");
    await expect(eventBoxes.first()).toContainText("4R");
  });

  test("Complete use case UC001 - short bout", async ({ page }) => {
    await page.goto(BASE_URL);

    // Step 1-2: Release scoresheet (F4)
    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");

    // Step 3-4: Start bout time (Space)
    await page.keyboard.press(" ");
    await page.waitForTimeout(200);

    // Step 5-6: Record 1B
    await page.keyboard.press("1");
    await page.keyboard.press("B");
    await expect(page.locator("#score-blue")).toHaveText("1");

    // Step 7-8: Stop bout time (Space)
    await page.keyboard.press(" ");
    await page.waitForTimeout(200);

    // Step 9-10: Start bout time (Space)
    await page.keyboard.press(" ");
    await page.waitForTimeout(200);

    // Step 11-12: Stop bout time (Space)
    await page.keyboard.press(" ");
    await page.waitForTimeout(200);

    // Step 13-14: Record 4R
    await page.keyboard.press("4");
    await page.keyboard.press("R");
    await expect(page.locator("#score-red")).toHaveText("4");

    // Verify timeline has 2 bout events (1B and 4R)
    const timeline = page.locator("#timeline");
    const boutEvents = timeline.locator(".entry-box").filter({ hasNotText: "+" });
    await expect(boutEvents).toHaveCount(2);
    await expect(boutEvents.nth(0)).toContainText("1B");
    await expect(boutEvents.nth(1)).toContainText("4R");

    // Verify next-event is still present
    await expect(page.locator("#next-event")).toBeVisible();

    // Step 15-19: Complete bout (F4 and dialog)
    page.on("dialog", async (dialog) => {
      const message = dialog.message();
      if (message.includes("Siegart")) {
        await dialog.accept("SS");
      } else if (message.includes("Sieger")) {
        await dialog.accept("4");
      } else if (message.includes("Verlierer")) {
        await dialog.accept("0");
      }
    });

    await page.keyboard.press("F4");
    await page.waitForTimeout(500);

    // Button should return to "Freigeben"
    await expect(page.locator("#release-complete-button")).toContainText("Freigeben");
  });

  test("Export functionality generates valid JSON", async ({ page }) => {
    await page.goto(BASE_URL);

    // Release and record a simple bout
    await page.keyboard.press("F4");
    await page.keyboard.press(" ");
    await page.waitForTimeout(200);
    await page.keyboard.press("1");
    await page.keyboard.press("B");
    await page.waitForTimeout(200);
    await page.keyboard.press(" ");

    // Generate export programmatically (not download)
    const exportData = await page.evaluate(() => {
      return window.exportHelper.generate();
    });

    // Verify export structure
    expect(exportData).toHaveProperty("exportVersion");
    expect(exportData).toHaveProperty("metadata");
    expect(exportData).toHaveProperty("bout");
    
    // Verify bout structure
    expect(exportData.bout).toHaveProperty("header");
    expect(exportData.bout).toHaveProperty("summary");
    expect(exportData.bout).toHaveProperty("events");
    
    // Verify events
    expect(exportData.bout.events.length).toBeGreaterThan(0);
    expect(exportData.bout.events[0].eventType).toBe("ScoresheetReleased");
    
    // Verify scores
    expect(exportData.bout.summary.scores.blue).toBe(1);
    expect(exportData.bout.summary.scores.red).toBe(0);
    
    // Verify timeline contains only bout events
    expect(exportData.bout.summary.timeline.length).toBe(1);
    expect(exportData.bout.summary.timeline[0].eventType).toBe("1B");
  });

  test("Multiple events update scores correctly", async ({ page }) => {
    await page.goto(BASE_URL);

    await page.keyboard.press("F4");
    await page.keyboard.press(" ");

    // Record multiple events
    await page.keyboard.press("1"); await page.keyboard.press("R");
    await page.waitForTimeout(100);
    await page.keyboard.press("2"); await page.keyboard.press("B");
    await page.waitForTimeout(100);
    await page.keyboard.press("4"); await page.keyboard.press("R");
    await page.waitForTimeout(100);
    await page.keyboard.press("1"); await page.keyboard.press("B");

    // Verify final scores
    await expect(page.locator("#score-red")).toHaveText("5"); // 1 + 4
    await expect(page.locator("#score-blue")).toHaveText("3"); // 2 + 1
  });

  test("Passivity events are recorded", async ({ page }) => {
    await page.goto(BASE_URL);

    await page.keyboard.press("F4");
    await page.keyboard.press(" ");
    await page.waitForTimeout(100);

    // Record passivity for red
    await page.keyboard.press("P");
    await page.keyboard.press("R");

    // Check timeline
    const timeline = page.locator("#timeline");
    await expect(timeline.locator(".entry-box").first()).toContainText("PR");
  });

  test("Caution events update scores correctly", async ({ page }) => {
    await page.goto(BASE_URL);

    await page.keyboard.press("F4");
    await page.keyboard.press(" ");
    await page.waitForTimeout(100);

    // Record caution: Red gets caution, Blue gets 1 point (0R1B)
    await page.keyboard.press("R");
    await page.keyboard.press("0");
    await page.keyboard.press("1");

    // Blue should have 1 point
    await expect(page.locator("#score-blue")).toHaveText("1");

    // Timeline should show caution entry
    const timeline = page.locator("#timeline");
    const cautionBox = timeline.locator(".entry-box.caution").first();
    await expect(cautionBox).toBeVisible();
  });

  test("Hidden test hooks work correctly", async ({ page }) => {
    await page.goto(BASE_URL);

    const boutTimeDisplay = page.locator("#bout-time-display");
    await expect(boutTimeDisplay).toHaveText("3:00");

    // Use hidden start button (no need to release scoresheet, test buttons work in any mode)
    await page.locator("#start").click({ force: true });
    await page.waitForTimeout(1200);
    
    // Check time has decreased
    const timeAfterStart = await boutTimeDisplay.textContent();
    const [min, sec] = timeAfterStart.split(':').map(s => parseInt(s));
    const totalSeconds = min * 60 + sec;
    expect(totalSeconds).toBeLessThan(180);
    expect(totalSeconds).toBeGreaterThan(176);

    // Use hidden stop button
    await page.locator("#stop").click({ force: true });
    const stoppedTime = await boutTimeDisplay.textContent();
    await page.waitForTimeout(1200);
    await expect(boutTimeDisplay).toHaveText(stoppedTime);
  });

  test("Invalid key sequences are ignored", async ({ page }) => {
    await page.goto(BASE_URL);

    await page.keyboard.press("F4");

    // Try invalid sequence: R followed by X
    await page.keyboard.press("R");
    await page.keyboard.press("X"); // Invalid continuation

    // Timeline should still be empty (no events recorded)
    const timeline = page.locator("#timeline");
    const boutEvents = timeline.locator(".entry-box").filter({ hasNotText: "+" });
    await expect(boutEvents).toHaveCount(0);

    // Now try valid sequence after invalid
    await page.keyboard.press("1");
    await page.keyboard.press("R");

    // This should work
    await expect(page.locator("#score-red")).toHaveText("1");
  });

  test("Escape key clears key buffer", async ({ page }) => {
    await page.goto(BASE_URL);

    await page.keyboard.press("F4");

    // Start typing sequence but escape before completion
    await page.keyboard.press("R");
    await page.keyboard.press("Escape");

    // Now press 1 - should not complete R1
    await page.keyboard.press("1");

    // Score should still be 0
    await expect(page.locator("#score-red")).toHaveText("0");

    // Complete valid sequence 1R
    await page.keyboard.press("R");
    await expect(page.locator("#score-red")).toHaveText("1");
  });
});
