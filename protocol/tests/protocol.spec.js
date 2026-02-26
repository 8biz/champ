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

    // Button should change to "Fertigstellen"
    const releaseButton = page.locator("#release-complete-button");
    await expect(releaseButton).toContainText("Fertigstellen");

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

    // Step 1-2: Release scoresheet (F4) → Recording state
    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Fertigstellen");

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

    // Step 15-19: Complete bout (F4 to enter Completing, then F4 to finish)
    await page.keyboard.press("F4");
    await page.waitForTimeout(200);

    // Now in Completing state - button shows "Abschließen"
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");

    // Completion form should be visible and unfrozen
    await expect(page.locator("#completion-form")).toBeVisible();

    // Select winner "Rot"
    await page.selectOption("#compl-winner", "red");

    // Press F4 to apply completion → Completed state
    await page.keyboard.press("F4");
    await page.waitForTimeout(200);

    // Button should now show "Korrigieren"
    await expect(page.locator("#release-complete-button")).toContainText("Korrigieren");

    // Form should be frozen (controls disabled)
    await expect(page.locator("#compl-winner")).toBeDisabled();
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

  test("Event buttons work correctly when clicked", async ({ page }) => {
    await page.goto(BASE_URL);

    // Release scoresheet first
    await page.keyboard.press("F4");

    // Click 1R button
    const button1R = page.locator('#event-buttons-red .event-btn', { hasText: '[1R]' });
    await button1R.click();
    await expect(page.locator("#score-red")).toHaveText("1");
    await expect(page.locator("#score-blue")).toHaveText("0");

    // Click 2B button
    const button2B = page.locator('#event-buttons-blue .event-btn', { hasText: '[2B]' });
    await button2B.click();
    await expect(page.locator("#score-red")).toHaveText("1");
    await expect(page.locator("#score-blue")).toHaveText("2");

    // Click 4R button
    const button4R = page.locator('#event-buttons-red .event-btn', { hasText: '[4R]' });
    await button4R.click();
    await expect(page.locator("#score-red")).toHaveText("5");
    await expect(page.locator("#score-blue")).toHaveText("2");

    // Click 5B button
    const button5B = page.locator('#event-buttons-blue .event-btn', { hasText: '[5B]' });
    await button5B.click();
    await expect(page.locator("#score-red")).toHaveText("5");
    await expect(page.locator("#score-blue")).toHaveText("7");

    // Verify timeline has 4 bout event entries (excluding next-event)
    const timelineEntries = page.locator('.timeline .entry:not(#next-event)');
    await expect(timelineEntries).toHaveCount(4);
  });

  test("Passivity buttons work when clicked", async ({ page }) => {
    await page.goto(BASE_URL);

    // Release scoresheet
    await page.keyboard.press("F4");

    // Click PR button (Red passivity)
    const buttonPR = page.locator('#event-buttons-red .event-btn', { hasText: '[PR]' });
    await buttonPR.click();

    // Click PB button (Blue passivity)
    const buttonPB = page.locator('#event-buttons-blue .event-btn', { hasText: '[PB]' });
    await buttonPB.click();

    // Verify timeline has 2 bout event entries (excluding next-event)
    const timelineEntries = page.locator('.timeline .entry:not(#next-event)');
    await expect(timelineEntries).toHaveCount(2);

    // Verify passivity entries contain PR and PB
    const firstEntry = timelineEntries.nth(0).locator('.entry-box');
    await expect(firstEntry).toHaveText("PR");
    
    const secondEntry = timelineEntries.nth(1).locator('.entry-box');
    await expect(secondEntry).toHaveText("PB");
  });

  test("Caution buttons send full key sequence", async ({ page }) => {
    await page.goto(BASE_URL);

    // Release scoresheet
    await page.keyboard.press("F4");

    // Click 0R1B button (caution for Red, Blue gets 1 point)
    const button0R1B = page.locator('#event-buttons-red .event-btn', { hasText: '[0R1B]' });
    await button0R1B.click();

    // Verify scores: Red should have 0, Blue should have 1
    await expect(page.locator("#score-red")).toHaveText("0");
    await expect(page.locator("#score-blue")).toHaveText("1");

    // Verify timeline entry (excluding next-event)
    let timelineEntries = page.locator('.timeline .entry:not(#next-event)');
    await expect(timelineEntries).toHaveCount(1);
    
    let entry = timelineEntries.nth(0).locator('.entry-box');
    await expect(entry).toHaveClass(/caution/);

    // Click 0B2R button (caution for Blue, Red gets 2 points)
    const button0B2R = page.locator('#event-buttons-blue .event-btn', { hasText: '[0B2R]' });
    await button0B2R.click();

    // Verify scores: Red should have 2, Blue should have 1
    await expect(page.locator("#score-red")).toHaveText("2");
    await expect(page.locator("#score-blue")).toHaveText("1");

    // Verify timeline now has 2 entries
    timelineEntries = page.locator('.timeline .entry:not(#next-event)');
    await expect(timelineEntries).toHaveCount(2);
  });

  test("Spacebar after clicking event button does not repeat event", async ({ page }) => {
    await page.goto(BASE_URL);

    // Release scoresheet and click a point button
    await page.keyboard.press("F4");
    const button1R = page.locator('#event-buttons-red .event-btn', { hasText: '[1R]' });
    await button1R.click();

    // Baseline assertions
    await expect(page.locator("#score-red")).toHaveText("1");
    await expect(page.locator("#score-blue")).toHaveText("0");
    const timelineEntries = page.locator('.timeline .entry:not(#next-event)');
    await expect(timelineEntries).toHaveCount(1);

    // Press space to start timer, wait briefly, then stop
    const timeDisplay = page.locator('#bout-time-display');
    await page.keyboard.press(" ");
    await page.waitForTimeout(350);
    await page.keyboard.press(" ");

    // Timer should have advanced (fraction digit changed) but no new events
    await expect(timeDisplay).not.toHaveAttribute('data-fraction', '0');
    await expect(page.locator("#score-red")).toHaveText("1");
    await expect(page.locator("#score-blue")).toHaveText("0");
    await expect(timelineEntries).toHaveCount(1);
  });

  test("Spacebar after clicking release button starts timer, not Completing", async ({ page }) => {
    await page.goto(BASE_URL);

    // Click the release button with mouse (focus would stay on it)
    const releaseButton = page.locator('#release-complete-button');
    await releaseButton.click();

    // After release, form should stay disabled (Recording state)
    const winnerSelect = page.locator('#compl-winner');
    await expect(winnerSelect).toBeDisabled();

    // Press space to start timer
    const timeDisplay = page.locator('#bout-time-display');
    await page.keyboard.press(" ");
    await page.waitForTimeout(350);
    await page.keyboard.press(" ");

    // Timer should have advanced; still in Recording (form remains disabled)
    await expect(timeDisplay).not.toHaveAttribute('data-fraction', '0');
    await expect(winnerSelect).toBeDisabled();

    // Release button text should still indicate Recording -> Completing action
    await expect(releaseButton).toContainText('Fertigstellen');
  });
});

test.describe("CHAMP Protocol - Ruleset victoryTypes", () => {
  test("Victory types dropdown has unique type entries", async ({ page }) => {
    await page.goto(BASE_URL);

    const types = await page.evaluate(() => {
      const ruleset = window.rulesetHelper.load();
      return ruleset.victoryTypes.map(vt => vt.type);
    });

    // All types must be unique
    const uniqueTypes = new Set(types);
    expect(uniqueTypes.size).toBe(types.length);
  });

  test("classificationPoints is an object with winner and looser", async ({ page }) => {
    await page.goto(BASE_URL);

    const allValid = await page.evaluate(() => {
      const ruleset = window.rulesetHelper.load();
      return ruleset.victoryTypes.every(vt => {
        const cp = vt.classificationPoints;
        return cp && typeof cp === 'object' && !Array.isArray(cp) &&
               cp.winner !== undefined && cp.looser !== undefined;
      });
    });

    expect(allValid).toBe(true);
  });

  test("resolveClassificationPoints returns correct points for constant values", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      const cp = { winner: 4, looser: 0 };
      return window.rulesetHelper.resolveClassificationPoints(cp, {});
    });

    expect(result.winner).toBe(4);
    expect(result.looser).toBe(0);
  });

  test("resolveClassificationPoints evaluates conditional winner points (score diff 10 → 3pts)", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      const ruleset = window.rulesetHelper.load();
      const ps = ruleset.victoryTypes.find(vt => vt.type === 'PS');
      const context = { scoreDifference: 10 }; // gte 8, lte 14 → 3 points
      return window.rulesetHelper.resolveClassificationPoints(ps.classificationPoints, context);
    });

    expect(result.winner).toBe(3);
    expect(result.looser).toBe(0);
  });

  test("resolveClassificationPoints evaluates conditional winner points (score diff 5 → 2pts)", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      const ruleset = window.rulesetHelper.load();
      const ps = ruleset.victoryTypes.find(vt => vt.type === 'PS');
      const context = { scoreDifference: 5 }; // gte 3, lte 7 → 2 points
      return window.rulesetHelper.resolveClassificationPoints(ps.classificationPoints, context);
    });

    expect(result.winner).toBe(2);
    expect(result.looser).toBe(0);
  });

  test("resolveClassificationPoints evaluates conditional winner points (score diff 1 → 1pt)", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      const ruleset = window.rulesetHelper.load();
      const ps = ruleset.victoryTypes.find(vt => vt.type === 'PS');
      const context = { scoreDifference: 1 }; // gte 0, lte 2 → 1 point
      return window.rulesetHelper.resolveClassificationPoints(ps.classificationPoints, context);
    });

    expect(result.winner).toBe(1);
    expect(result.looser).toBe(0);
  });

  test("Completion form auto-fills conditional points based on score difference", async ({ page }) => {
    await page.goto(BASE_URL);

    // Release scoresheet and record events to create a score difference of 10
    await page.keyboard.press("F4");
    await page.keyboard.press(" ");
    // Record 4R + 4R + 2R = 10 for red, 0 for blue → scoreDifference = 10
    await page.keyboard.press("4"); await page.keyboard.press("R");
    await page.keyboard.press("4"); await page.keyboard.press("R");
    await page.keyboard.press("2"); await page.keyboard.press("R");
    await page.keyboard.press(" ");

    // Enter Completing state
    await page.keyboard.press("F4");
    await expect(page.locator("#completion-form")).toBeVisible();

    // Select Red as winner and PS as victory type
    await page.selectOption("#compl-winner", "red");
    await page.selectOption("#compl-victory-type", "PS");

    // With scoreDifference=10 (gte 8, lte 14), winner should get 3 pts
    await expect(page.locator("#compl-points-red")).toHaveValue("3");
    await expect(page.locator("#compl-points-blue")).toHaveValue("0");
  });

  test("Blue winner: form shows blue getting winner pts, export stores [winner,loser]", async ({ page }) => {
    await page.goto(BASE_URL);

    // Record 10 pts for blue
    await page.keyboard.press("F4");
    await page.keyboard.press(" ");
    await page.keyboard.press("4"); await page.keyboard.press("B");
    await page.keyboard.press("4"); await page.keyboard.press("B");
    await page.keyboard.press("2"); await page.keyboard.press("B");
    await page.keyboard.press(" ");

    await expect(page.locator("#score-blue")).toHaveText("10");

    // Enter Completing, select blue winner + PS (score diff 10 → 3 pts)
    await page.keyboard.press("F4");
    await page.selectOption("#compl-winner", "blue");
    await page.selectOption("#compl-victory-type", "PS");

    // Form: blue field (winner) = 3, red field (loser) = 0
    await expect(page.locator("#compl-points-blue")).toHaveValue("3");
    await expect(page.locator("#compl-points-red")).toHaveValue("0");

    // Complete and verify export stores [winner, loser] = [3, 0]
    await page.keyboard.press("F4");
    await page.waitForTimeout(100);

    const exportData = await page.evaluate(() => window.exportHelper.generate());
    const cp = exportData.bout.summary.victory.classificationPoints;
    // classificationPoints must be [winner, loser]
    expect(cp[0]).toBe(3); // winner (blue) gets 3
    expect(cp[1]).toBe(0); // loser (red) gets 0
  });

  test("Ruleset validates that type is unique", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      const duplicateRuleset = {
        metadata: { name: "test", description: "test", languages: ["de"], author: "test" },
        periodTimesInSeconds: [180],
        periodTimeCountingDirection: "Down",
        periodBreakTimeInSeconds: 30,
        injuryTimeWithoutBloodInSeconds: 120,
        injuryTimeWithBloodInSeconds: 240,
        injuryTimeCountingDirection: "Up",
        victoryTypes: [
          { type: "PS", description: "A", classificationPoints: { winner: 3, looser: 0 } },
          { type: "PS", description: "B", classificationPoints: { winner: 1, looser: 0 } }
        ]
      };
      return window.rulesetHelper.validate(duplicateRuleset);
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('not unique'))).toBe(true);
  });

  test("Ruleset validates that classificationPoints is object not array", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      const oldFormatRuleset = {
        metadata: { name: "test", description: "test", languages: ["de"], author: "test" },
        periodTimesInSeconds: [180],
        periodTimeCountingDirection: "Down",
        periodBreakTimeInSeconds: 30,
        injuryTimeWithoutBloodInSeconds: 120,
        injuryTimeWithBloodInSeconds: 240,
        injuryTimeCountingDirection: "Up",
        victoryTypes: [
          { type: "SS", description: "Test", classificationPoints: [4, 0] }
        ]
      };
      return window.rulesetHelper.validate(oldFormatRuleset);
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('classificationPoints'))).toBe(true);
  });
});

test.describe("CHAMP Protocol - Time Modification Mode (TT)", () => {
  test("TT opens time modification modal in Recording mode", async ({ page }) => {
    await page.goto(BASE_URL);

    // Release scoresheet to enter Recording mode
    await page.keyboard.press("F4");

    // Modal should not be visible yet
    const modal = page.locator("#time-mod-modal");
    await expect(modal).not.toBeVisible();

    // Press T twice to open modal
    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(modal).toBeVisible();
  });

  test("TT modal is pre-filled with current period time", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.keyboard.press("F4");

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    // Input should be pre-filled with "3:00" (the default period time)
    const input = page.locator("#time-mod-input");
    await expect(input).toHaveValue("3:00");
  });

  test("TT does not open modal in New (idle) mode", async ({ page }) => {
    await page.goto(BASE_URL);

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    const modal = page.locator("#time-mod-modal");
    await expect(modal).not.toBeVisible();
  });

  test("Escape closes the time modification modal without recording an event", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.keyboard.press("F4");

    const eventCountBefore = await page.evaluate(() => window.__appState ? window.__appState.events.length : null);

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    const modal = page.locator("#time-mod-modal");
    await expect(modal).toBeVisible();

    // Press Escape inside the input to close
    await page.locator("#time-mod-input").press("Escape");
    await expect(modal).not.toBeVisible();

    // Timer display should be unchanged
    await expect(page.locator("#bout-time-display")).toHaveText("3:00");
  });

  test("Cancel button closes the modal without changing the time", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.keyboard.press("F4");

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    const modal = page.locator("#time-mod-modal");
    await expect(modal).toBeVisible();

    await page.locator("#time-mod-cancel").click();
    await expect(modal).not.toBeVisible();

    await expect(page.locator("#bout-time-display")).toHaveText("3:00");
  });

  test("Confirming a valid time updates the bout time display", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.keyboard.press("F4");

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    const input = page.locator("#time-mod-input");
    await input.fill("2:30");
    await input.press("Enter");

    // Modal should close
    const modal = page.locator("#time-mod-modal");
    await expect(modal).not.toBeVisible();

    // Display should now show 2:30
    await expect(page.locator("#bout-time-display")).toHaveText("2:30");
  });

  test("Confirming via OK button updates the bout time display", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.keyboard.press("F4");

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    const input = page.locator("#time-mod-input");
    await input.fill("1:45");
    await page.locator("#time-mod-confirm").click();

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    await expect(page.locator("#bout-time-display")).toHaveText("1:45");
  });

  test("Confirming records a T_Modified event in the event log", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.keyboard.press("F4");

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await page.locator("#time-mod-input").fill("2:00");
    await page.locator("#time-mod-confirm").click();

    const events = await page.evaluate(() => window.exportHelper.generate().bout.events);
    const modifiedEvent = events.find(e => e.eventType === "T_Modified");
    expect(modifiedEvent).toBeDefined();
    // newTime = (3:00 - 2:00) elapsed = 60s = 600 units
    expect(modifiedEvent.newTime).toBe(600);
  });

  test("Invalid time format shows error and keeps modal open", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.keyboard.press("F4");

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    const input = page.locator("#time-mod-input");
    await input.fill("abc");
    await input.press("Enter");

    // Modal should remain open
    await expect(page.locator("#time-mod-modal")).toBeVisible();
    // Error message should be shown
    await expect(page.locator("#time-mod-error")).toBeVisible();
  });

  test("Entering time larger than period shows error and keeps modal open", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.keyboard.press("F4");

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    const input = page.locator("#time-mod-input");
    await input.fill("4:00");
    await input.press("Enter");

    // Modal should remain open and show the new error message
    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await expect(page.locator("#time-mod-error")).toBeVisible();

    // Display should remain unchanged
    await expect(page.locator("#bout-time-display")).toHaveText("3:00");
  });

  test("TT does not open modal while timer is running", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.keyboard.press("F4");

    // Start timer
    await page.keyboard.press(" ");

    // Press TT - modal must NOT open while timer runs
    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
  });

  test("TT opens modal after timer is stopped", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.keyboard.press("F4");

    // Start timer then stop it
    await page.keyboard.press(" ");
    await page.waitForTimeout(200);
    await page.keyboard.press(" ");

    // Now TT should open modal
    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("TT works in Completing mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.keyboard.press("F4");
    // Enter Completing state
    await page.keyboard.press("F4");

    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");

    // TT should open modal in Completing mode
    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });
});
