import { test, expect } from "@playwright/test";

const BASE_URL = "file://" + process.cwd() + "/protocol/protocol.html";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Release the scoresheet for recording (F4 from New → Recording). */
async function releaseScoresheet(page) {
  await page.keyboard.press("F4");
}

/**
 * Set the remaining bout (period) time via the TT time-modification modal.
 * Requires the scoresheet to be in Recording or Completing mode with the
 * timer stopped.
 * @param {import('@playwright/test').Page} page
 * @param {string} remainingTime  Remaining period time in "M:SS" format
 */
async function setBoutTime(page, remainingTime) {
  await page.keyboard.press("t");
  await page.keyboard.press("t");
  const input = page.locator("#time-mod-input");
  await input.fill(remainingTime);
  await input.press("Enter");
}

/**
 * Set bout time to a specific remaining value and then record a bout event
 * via keyboard.  Avoids starting/stopping the real timer, making tests fast
 * and deterministic.
 * @param {import('@playwright/test').Page} page
 * @param {string} remainingTime  Remaining period time in "M:SS" format
 * @param {string[]} keys         Key presses for the event, e.g. ["1","B"]
 */
async function recordEventAtTime(page, remainingTime, keys) {
  await setBoutTime(page, remainingTime);
  for (const key of keys) {
    await page.keyboard.press(key);
  }
}

// ── UC001 Short Bout ────────────────────────────────────────────────────────

test.describe("CHAMP Protocol - UC001 Short Bout", () => {
  test("Initial state - Idle mode", async ({ page }) => {
    await page.goto(BASE_URL);

    // Check initial time display
    await expect(page.locator("#bout-time-display")).toHaveText("3:00");

    // Check initial scores
    await expect(page.locator("#score-red")).toHaveText("0");
    await expect(page.locator("#score-blue")).toHaveText("0");

    // Check Release button
    await expect(page.locator("#release-complete-button")).toContainText("Freigeben");

    // Next-event must not be visible in New state
    await expect(page.locator("#next-event")).not.toBeVisible();
  });

  test("Release scoresheet with F4 key", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await expect(page.locator("#release-complete-button")).toContainText("Fertigstellen");
    await expect(page.locator("#next-event")).toBeVisible();
    await expect(page.locator("#bout-info")).toBeDisabled();
  });

  // ── Timer tests (must use real timer) ────────────────────────────────────

  test("Timer starts and counts down with Space key", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await expect(page.locator("#bout-time-display")).toHaveText("3:00");

    // Start timer with Space
    await page.keyboard.press(" ");
    await page.waitForTimeout(1100);

    // Time should have decreased
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

  // ── Event recording via keyboard ─────────────────────────────────────────

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

  // ── UC001 full flow ──────────────────────────────────────────────────────

  test("Complete use case UC001 - short bout", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await expect(page.locator("#release-complete-button")).toContainText("Fertigstellen");

    // Record 1B at bout time 2:50
    await recordEventAtTime(page, "2:50", ["1", "B"]);
    await expect(page.locator("#score-blue")).toHaveText("1");

    // Record 4R at bout time 2:20
    await recordEventAtTime(page, "2:20", ["4", "R"]);
    await expect(page.locator("#score-red")).toHaveText("4");

    // Verify timeline
    const boutEvents = page.locator("#timeline .entry-box").filter({ hasNotText: "+" });
    await expect(boutEvents).toHaveCount(2);
    await expect(boutEvents.nth(0)).toContainText("1B");
    await expect(boutEvents.nth(1)).toContainText("4R");
    await expect(page.locator("#next-event")).toBeVisible();

    // Complete bout → Completing → select winner → Completed
    await page.keyboard.press("F4");
    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");
    await expect(page.locator("#completion-form")).toBeVisible();

    await page.selectOption("#compl-winner", "red");
    await page.keyboard.press("F4");

    await expect(page.locator("#release-complete-button")).toContainText("Korrigieren");
    await expect(page.locator("#compl-winner")).toBeDisabled();
  });

  // ── Export ───────────────────────────────────────────────────────────────

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

  // ── Hidden test hooks (must use real timer) ──────────────────────────────

  test("Hidden test hooks work correctly", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("#bout-time-display")).toHaveText("3:00");

    // Hidden start bypasses mode checks
    await page.locator("#start").click({ force: true });
    await page.waitForTimeout(1200);

    const timeAfterStart = await page.locator("#bout-time-display").textContent();
    const [min, sec] = timeAfterStart.split(':').map(s => parseInt(s));
    expect(min * 60 + sec).toBeLessThan(180);
    expect(min * 60 + sec).toBeGreaterThan(176);

    // Hidden stop freezes the timer
    await page.locator("#stop").click({ force: true });
    const stoppedTime = await page.locator("#bout-time-display").textContent();
    await page.waitForTimeout(1200);
    await expect(page.locator("#bout-time-display")).toHaveText(stoppedTime);
  });

  // ── Keyboard buffer ──────────────────────────────────────────────────────

  test("Invalid key sequences are ignored", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // R followed by X is invalid
    await page.keyboard.press("R");
    await page.keyboard.press("X");

    const boutEvents = page.locator("#timeline .entry-box").filter({ hasNotText: "+" });
    await expect(boutEvents).toHaveCount(0);

    // Valid sequence after invalid still works
    await page.keyboard.press("1");
    await page.keyboard.press("R");
    await expect(page.locator("#score-red")).toHaveText("1");
  });

  test("Escape key clears key buffer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Start a sequence then Escape
    await page.keyboard.press("R");
    await page.keyboard.press("Escape");

    // Pressing 1 alone should not complete "R1"
    await page.keyboard.press("1");
    await expect(page.locator("#score-red")).toHaveText("0");

    // But 1 + R still works
    await page.keyboard.press("R");
    await expect(page.locator("#score-red")).toHaveText("1");
  });

  // ── Event buttons (click) ───────────────────────────────────────────────

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

  // ── Spacebar interaction (must use real timer) ──────────────────────────

  test("Spacebar after clicking event button does not repeat event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.locator('#event-buttons-red .event-btn', { hasText: '[1R]' }).click();
    await expect(page.locator("#score-red")).toHaveText("1");

    const entries = page.locator('.timeline .entry:not(#next-event)');
    await expect(entries).toHaveCount(1);

    // Space starts timer — must not duplicate the event
    await page.keyboard.press(" ");
    await page.waitForTimeout(350);
    await page.keyboard.press(" ");

    await expect(page.locator('#bout-time-display')).not.toHaveAttribute('data-fraction', '0');
    await expect(page.locator("#score-red")).toHaveText("1");
    await expect(entries).toHaveCount(1);
  });

  test("Spacebar after clicking release button starts timer, not Completing", async ({ page }) => {
    await page.goto(BASE_URL);

    // Release via click (focus stays on button)
    await page.locator('#release-complete-button').click();
    await expect(page.locator('#compl-winner')).toBeDisabled();

    // Space should start the timer, NOT trigger Completing
    await page.keyboard.press(" ");
    await page.waitForTimeout(350);
    await page.keyboard.press(" ");

    await expect(page.locator('#bout-time-display')).not.toHaveAttribute('data-fraction', '0');
    await expect(page.locator('#compl-winner')).toBeDisabled();
    await expect(page.locator('#release-complete-button')).toContainText('Fertigstellen');
  });
});

// ── Ruleset victoryTypes ────────────────────────────────────────────────────

test.describe("CHAMP Protocol - Ruleset victoryTypes", () => {
  test("Victory types dropdown has unique type entries", async ({ page }) => {
    await page.goto(BASE_URL);

    const types = await page.evaluate(() => {
      const ruleset = window.rulesetHelper.load();
      return ruleset.victoryTypes.map(vt => vt.type);
    });
    expect(new Set(types).size).toBe(types.length);
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
      return window.rulesetHelper.resolveClassificationPoints({ winner: 4, looser: 0 }, {});
    });
    expect(result.winner).toBe(4);
    expect(result.looser).toBe(0);
  });

  test("resolveClassificationPoints evaluates conditional winner points (score diff 10 → 3pts)", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      const ruleset = window.rulesetHelper.load();
      const ps = ruleset.victoryTypes.find(vt => vt.type === 'PS');
      return window.rulesetHelper.resolveClassificationPoints(ps.classificationPoints, { scoreDifference: 10 });
    });
    expect(result.winner).toBe(3);
    expect(result.looser).toBe(0);
  });

  test("resolveClassificationPoints evaluates conditional winner points (score diff 5 → 2pts)", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      const ruleset = window.rulesetHelper.load();
      const ps = ruleset.victoryTypes.find(vt => vt.type === 'PS');
      return window.rulesetHelper.resolveClassificationPoints(ps.classificationPoints, { scoreDifference: 5 });
    });
    expect(result.winner).toBe(2);
    expect(result.looser).toBe(0);
  });

  test("resolveClassificationPoints evaluates conditional winner points (score diff 1 → 1pt)", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      const ruleset = window.rulesetHelper.load();
      const ps = ruleset.victoryTypes.find(vt => vt.type === 'PS');
      return window.rulesetHelper.resolveClassificationPoints(ps.classificationPoints, { scoreDifference: 1 });
    });
    expect(result.winner).toBe(1);
    expect(result.looser).toBe(0);
  });

  test("Completion form auto-fills conditional points based on score difference", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Record 4R + 4R + 2R = 10 for Red
    await recordEventAtTime(page, "2:50", ["4", "R"]);
    await recordEventAtTime(page, "2:40", ["4", "R"]);
    await recordEventAtTime(page, "2:30", ["2", "R"]);

    // Enter Completing state
    await page.keyboard.press("F4");
    await expect(page.locator("#completion-form")).toBeVisible();

    await page.selectOption("#compl-winner", "red");
    await page.selectOption("#compl-victory-type", "PS");

    // scoreDifference = 10 (gte 8, lte 14) → winner gets 3 pts
    await expect(page.locator("#compl-points-red")).toHaveValue("3");
    await expect(page.locator("#compl-points-blue")).toHaveValue("0");
  });

  test("Blue winner: form shows blue getting winner pts, export stores [winner,loser]", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    // Record 4B + 4B + 2B = 10 for Blue
    await recordEventAtTime(page, "2:50", ["4", "B"]);
    await recordEventAtTime(page, "2:40", ["4", "B"]);
    await recordEventAtTime(page, "2:30", ["2", "B"]);
    await expect(page.locator("#score-blue")).toHaveText("10");

    // Enter Completing, select blue + PS (diff 10 → 3 pts)
    await page.keyboard.press("F4");
    await page.selectOption("#compl-winner", "blue");
    await page.selectOption("#compl-victory-type", "PS");

    await expect(page.locator("#compl-points-blue")).toHaveValue("3");
    await expect(page.locator("#compl-points-red")).toHaveValue("0");

    // Complete and verify export stores [winner, loser]
    await page.keyboard.press("F4");
    const exportData = await page.evaluate(() => window.exportHelper.generate());
    const cp = exportData.bout.summary.victory.classificationPoints;
    expect(cp[0]).toBe(3); // winner (blue)
    expect(cp[1]).toBe(0); // loser (red)
  });

  test("Ruleset validates that type is unique", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      return window.rulesetHelper.validate({
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
      });
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('not unique'))).toBe(true);
  });

  test("Ruleset validates that classificationPoints is object not array", async ({ page }) => {
    await page.goto(BASE_URL);

    const result = await page.evaluate(() => {
      return window.rulesetHelper.validate({
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
      });
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('classificationPoints'))).toBe(true);
  });
});

// ── Time Modification Mode (TT) ────────────────────────────────────────────

test.describe("CHAMP Protocol - Time Modification Mode (TT)", () => {
  test("TT opens time modification modal in Recording mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
  });

  test("TT modal is pre-filled with current period time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-input")).toHaveValue("3:00");
  });

  test("TT does not open modal in New (idle) mode", async ({ page }) => {
    await page.goto(BASE_URL);

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
  });

  test("Escape closes the time modification modal without changing time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await expect(page.locator("#time-mod-modal")).toBeVisible();

    await page.locator("#time-mod-input").press("Escape");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    await expect(page.locator("#bout-time-display")).toHaveText("3:00");
  });

  test("Cancel button closes the modal without changing the time", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await expect(page.locator("#time-mod-modal")).toBeVisible();

    await page.locator("#time-mod-cancel").click();

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    await expect(page.locator("#bout-time-display")).toHaveText("3:00");
  });

  test("Confirming a valid time updates the bout time display", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("2:30");
    await page.locator("#time-mod-input").press("Enter");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
    await expect(page.locator("#bout-time-display")).toHaveText("2:30");
  });

  test("Confirming records a T_Modified event in the event log", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("2:00");
    await page.locator("#time-mod-confirm").click();

    const events = await page.evaluate(() => window.exportHelper.generate().bout.events);
    const modifiedEvent = events.find(e => e.eventType === "T_Modified");
    expect(modifiedEvent).toBeDefined();
    // 3:00 → 2:00 remaining ⇒ 60 s elapsed ⇒ 600 × 100 ms
    expect(modifiedEvent.newTime).toBe(600);
  });

  test("Invalid time format shows error and keeps modal open", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("abc");
    await page.locator("#time-mod-input").press("Enter");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await expect(page.locator("#time-mod-error")).toBeVisible();
  });

  test("Entering time larger than period shows error and keeps modal open", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("4:00");
    await page.locator("#time-mod-input").press("Enter");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await expect(page.locator("#time-mod-error")).toBeVisible();
    await expect(page.locator("#bout-time-display")).toHaveText("3:00");
  });

  // ── Timer-dependent TT tests ────────────────────────────────────────────

  test("TT does not open modal while timer is running", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press(" ");

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).not.toBeVisible();
  });

  test("TT opens modal after timer is stopped", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press(" ");
    await page.waitForTimeout(200);
    await page.keyboard.press(" ");

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });

  test("TT works in Completing mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await page.keyboard.press("F4"); // → Completing

    await expect(page.locator("#release-complete-button")).toContainText("Abschließen");

    await page.keyboard.press("t");
    await page.keyboard.press("t");

    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await page.locator("#time-mod-cancel").click();
  });
});
