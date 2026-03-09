import { test, expect } from "@playwright/test";
import { BASE_URL, releaseScoresheet, recordEventAtTime } from "./helpers.js";

// ── Mouse / Touch Correction Mode ────────────────────────────────────────────

test.describe("CHAMP Protocol - Mouse/Touch Correction Mode", () => {

  // ── Left-click does NOT enter correction mode ─────────────────────────────

  test("left-clicking a timeline entry does NOT enter correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(false);
  });

  // ── Right-click opens context menu and enters correction mode ─────────────

  test("right-clicking a timeline entry enters correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(true);
    expect(state.cursorIndex).toBe(0);
  });

  test("right-clicking a timeline entry shows the context menu", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });

    await expect(page.locator("#context-menu")).toBeVisible();
  });

  // ── Keyboard ArrowLeft entry also shows context menu ─────────────────────

  test("ArrowLeft entering correction mode shows the context menu", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");

    await expect(page.locator("#context-menu")).toBeVisible();
  });

  test("context menu is hidden in normal mode (before entering correction mode)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await expect(page.locator("#context-menu")).toBeHidden();
  });

  test("context menu has delete item", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });

    await expect(page.locator("#ctx-delete")).toBeVisible();
  });

  test("context menu has insert item (disabled/no-op)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });

    await expect(page.locator("#ctx-insert")).toBeVisible();
  });

  test("context menu has swap item (disabled/no-op)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });

    await expect(page.locator("#ctx-swap")).toBeVisible();
  });

  test("context menu has time item (disabled/no-op)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });

    await expect(page.locator("#ctx-time")).toBeVisible();
  });

  test("context menu stays visible when clicking outside", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await expect(page.locator("#context-menu")).toBeVisible();

    // Click somewhere else — menu should stay visible
    await page.locator("#score-red").click();

    await expect(page.locator("#context-menu")).toBeVisible();
  });

  test("context menu closes when pressing Escape (exits correction mode)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await expect(page.locator("#context-menu")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.locator("#context-menu")).toBeHidden();
  });

  // ── Context menu: delete action ───────────────────────────────────────────

  test("clicking delete in context menu deletes the cursored event (stores in buffer)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-delete").click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(true);
    expect(state.correctionBuffer).toHaveLength(1);
    expect(state.correctionBuffer[0].deleted).toBe(true);
  });

  test("clicking delete in context menu keeps the context menu visible", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-delete").click();

    await expect(page.locator("#context-menu")).toBeVisible();
  });

  // ── Context menu moves with cursor ────────────────────────────────────────

  test("context menu moves when cursor moves left/right", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    await recordEventAtTime(page, "2:40", ["2", "B"]);

    // Enter correction mode on last event (2B, index 1)
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#context-menu")).toBeVisible();

    const pos1 = await page.locator("#context-menu").boundingBox();

    // Move cursor to first event (1R, index 0)
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#context-menu")).toBeVisible();

    const pos2 = await page.locator("#context-menu").boundingBox();

    // The menu should have moved to the left (first event is to the left of second)
    expect(pos2.x).toBeLessThan(pos1.x);
  });

  test("context menu closes when confirm button is clicked", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#context-menu")).toBeVisible();

    await page.locator("#corr-confirm").click();

    await expect(page.locator("#context-menu")).toBeHidden();
  });

  test("context menu closes when cancel button is clicked", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#context-menu")).toBeVisible();

    await page.locator("#corr-cancel").click();

    await expect(page.locator("#context-menu")).toBeHidden();
  });

  // ── Context menu: event insert mode via mouse/touch ──────────────────────

  test("clicking ctx-insert enters insert mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-insert").click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inInsertMode).toBe(true);
    expect(state.inCorrectionMode).toBe(true);
  });

  test("clicking ctx-insert does not immediately add to correction buffer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-insert").click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer).toHaveLength(0);
  });

  test("clicking ctx-insert disables ctx-delete in context menu", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-insert").click();

    await expect(page.locator("#ctx-delete")).toHaveAttribute("data-noop", "");
  });

  test("clicking ctx-insert disables ctx-insert itself in context menu", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-insert").click();

    await expect(page.locator("#ctx-insert")).toHaveAttribute("data-noop", "");
  });

  test("clicking ctx-insert shows the cancel item", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-insert").click();

    await expect(page.locator("#ctx-insert-cancel")).toBeVisible();
  });

  test("ctx-insert-cancel is hidden before insert mode is entered", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });

    await expect(page.locator("#ctx-insert-cancel")).toBeHidden();
  });

  test("clicking ctx-insert-cancel exits insert mode and stays in correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-insert").click();
    await page.locator("#ctx-insert-cancel").click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inInsertMode).toBe(false);
    expect(state.inCorrectionMode).toBe(true);
  });

  test("clicking ctx-insert-cancel re-enables ctx-delete in context menu", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-insert").click();
    await page.locator("#ctx-insert-cancel").click();

    await expect(page.locator("#ctx-delete")).not.toHaveAttribute("data-noop", "");
  });

  test("clicking ctx-insert-cancel re-enables ctx-insert in context menu", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-insert").click();
    await page.locator("#ctx-insert-cancel").click();

    await expect(page.locator("#ctx-insert")).not.toHaveAttribute("data-noop", "");
  });

  test("clicking ctx-insert-cancel hides the cancel item", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-insert").click();
    await page.locator("#ctx-insert-cancel").click();

    await expect(page.locator("#ctx-insert-cancel")).toBeHidden();
  });

  test("clicking event button in insert mode inserts event in correction buffer", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-insert").click();
    await page.locator("#event-buttons-red .event-btn").filter({ hasText: "[2R]" }).click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer).toHaveLength(1);
    expect(state.correctionBuffer[0].insertedEventType).toBe("2R");
  });

  test("clicking event button in insert mode exits insert mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-insert").click();
    await page.locator("#event-buttons-blue .event-btn").filter({ hasText: "[2B]" }).click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inInsertMode).toBe(false);
    expect(state.inCorrectionMode).toBe(true);
  });

  test("after event button in insert mode, context menu items are re-enabled", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-insert").click();
    await page.locator("#event-buttons-red .event-btn").filter({ hasText: "[2R]" }).click();

    await expect(page.locator("#ctx-delete")).not.toHaveAttribute("data-noop", "");
    await expect(page.locator("#ctx-insert-cancel")).toBeHidden();
  });

  test("clicking event button [0R1B] in insert mode inserts 0R1B caution event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.locator("#timeline .entry .entry-box").first().click({ button: "right" });
    await page.locator("#ctx-insert").click();
    await page.locator("#event-buttons-red .event-btn").filter({ hasText: "[0R1B]" }).click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer[0].insertedEventType).toBe("0R1B");
  });

  test("keyboard ## enters insert mode and updates context menu state", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("#");

    await expect(page.locator("#ctx-insert-cancel")).toBeVisible();
    await expect(page.locator("#ctx-delete")).toHaveAttribute("data-noop", "");
  });

  test("keyboard Escape in insert mode hides cancel item and re-enables context menu items", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("#");
    await page.keyboard.press("#");
    await page.keyboard.press("Escape");

    await expect(page.locator("#ctx-insert-cancel")).toBeHidden();
    await expect(page.locator("#ctx-delete")).not.toHaveAttribute("data-noop", "");
  });

  // ── Event button click in correction mode modifies current event ──────────

  test("clicking event button [2B] in correction mode modifies cursored event to 2B", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    // Enter correction mode
    await page.keyboard.press("ArrowLeft");

    // Click the [2B] button
    await page.locator("#event-buttons-blue .event-btn").filter({ hasText: "[2B]" }).click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer).toHaveLength(1);
    expect(state.correctionBuffer[0].newEventType).toBe("2B");
  });

  test("clicking event button [PR] in correction mode modifies cursored event to PR", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");

    await page.locator("#event-buttons-red .event-btn").filter({ hasText: "[PR]" }).click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer).toHaveLength(1);
    expect(state.correctionBuffer[0].newEventType).toBe("PR");
  });

  test("clicking event button in correction mode does NOT record a new event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);
    const eventsBefore = await page.evaluate(() => window.testHelper.getState());

    await page.keyboard.press("ArrowLeft");

    await page.locator("#event-buttons-blue .event-btn").filter({ hasText: "[2B]" }).click();

    // Score should reflect the modification (1R → 2B), not a new event added
    await expect(page.locator("#score-red")).toHaveText("0");
    await expect(page.locator("#score-blue")).toHaveText("2");
  });

  test("clicking event button [0R1B] in correction mode modifies cursored event to 0R1B", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");

    await page.locator("#event-buttons-red .event-btn").filter({ hasText: "[0R1B]" }).click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.correctionBuffer).toHaveLength(1);
    expect(state.correctionBuffer[0].newEventType).toBe("0R1B");
  });

  test("clicking event button outside correction mode still records new event normally", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    // Set bout time
    await page.keyboard.press("t");
    await page.keyboard.press("t");
    await page.locator("#time-mod-input").fill("2:50");
    await page.locator("#time-mod-input").press("Enter");

    // Click [1R] button (not in correction mode)
    await page.locator("#event-buttons-red .event-btn").filter({ hasText: "[1R]" }).click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(false);
    await expect(page.locator("#score-red")).toHaveText("1");
  });

  // ── Correction mode confirm/cancel buttons ────────────────────────────────

  test("confirm and cancel buttons are visible in correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");

    await expect(page.locator("#corr-confirm")).toBeVisible();
    await expect(page.locator("#corr-cancel")).toBeVisible();
  });

  test("confirm and cancel buttons are hidden outside correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await expect(page.locator("#corr-confirm")).toBeHidden();
    await expect(page.locator("#corr-cancel")).toBeHidden();
  });

  test("clicking confirm button applies corrections and exits correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    // Enter correction mode and modify event
    await page.keyboard.press("ArrowLeft");
    await page.locator("#event-buttons-blue .event-btn").filter({ hasText: "[2B]" }).click();

    // Click confirm button
    await page.locator("#corr-confirm").click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(false);
    // Modification was applied: score should reflect 2B instead of 1R
    await expect(page.locator("#score-red")).toHaveText("0");
    await expect(page.locator("#score-blue")).toHaveText("2");
  });

  test("clicking cancel button discards corrections and exits correction mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    // Enter correction mode and modify event
    await page.keyboard.press("ArrowLeft");
    await page.locator("#event-buttons-blue .event-btn").filter({ hasText: "[2B]" }).click();

    // Click cancel button
    await page.locator("#corr-cancel").click();

    const state = await page.evaluate(() => window.testHelper.getState());
    expect(state.inCorrectionMode).toBe(false);
    // Modification was discarded: score should still show original 1R
    await expect(page.locator("#score-red")).toHaveText("1");
    await expect(page.locator("#score-blue")).toHaveText("0");
  });

  test("confirm button has correct label text", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");

    await expect(page.locator("#corr-confirm")).toHaveText("[Enter] Übernehmen");
  });

  test("cancel button has correct label text", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await recordEventAtTime(page, "2:50", ["1", "R"]);

    await page.keyboard.press("ArrowLeft");

    await expect(page.locator("#corr-cancel")).toHaveText("[Esc] Verwerfen");
  });
});
