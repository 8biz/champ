import { test, expect } from "@playwright/test";

const BASE_URL = "file://" + process.cwd() + "/protocol/protocol.html";

// ── Helpers ─────────────────────────────────────────────────────────────────

async function releaseScoresheet(page) {
  await page.keyboard.press("F4");
}

/** Locates the primary entry-box inside #next-event. */
function nextEventBox(page) {
  // For caution sequences there are inner .caution-row elements; the
  // outer .entry-box is still the first child.
  return page.locator("#next-event .entry-box").first();
}

// ── Next-event presence ─────────────────────────────────────────────────────

test.describe("next-event presence", () => {
  test("next-event is absent in New state", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("#next-event")).not.toBeVisible();
  });

  test("next-event appears after scoresheet is released", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    await expect(page.locator("#next-event")).toBeVisible();
  });

  test("next-event shows '+' and is neutral by default", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    const box = nextEventBox(page);
    await expect(box).toHaveText("+");
    await expect(box).toHaveClass(/next/);
    await expect(box).not.toHaveClass(/red/);
    await expect(box).not.toHaveClass(/blue/);
  });
});

// ── Scenario 1: R → 2 ───────────────────────────────────────────────────────

test.describe("Scenario 1: R then 2", () => {
  test("pressing R shows 'R' with red background", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("r");

    const box = nextEventBox(page);
    await expect(box).toHaveText("R");
    await expect(box).toHaveClass(/red/);
    await expect(box).not.toHaveClass(/next/);
  });

  test("pressing 2 after R records event and resets next-event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("r");
    await page.keyboard.press("2");

    const box = nextEventBox(page);
    await expect(box).toHaveText("+");
    await expect(box).toHaveClass(/next/);
    await expect(page.locator("#score-red")).toHaveText("2");
  });
});

// ── Scenario 2: P → B ───────────────────────────────────────────────────────

test.describe("Scenario 2: P then B", () => {
  test("pressing P shows 'P' with neutral background", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("p");

    const box = nextEventBox(page);
    await expect(box).toHaveText("P");
    await expect(box).toHaveClass(/next/);
    await expect(box).not.toHaveClass(/red/);
    await expect(box).not.toHaveClass(/blue/);
  });

  test("pressing B after P records passivity and resets next-event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("p");
    await page.keyboard.press("b");

    const box = nextEventBox(page);
    await expect(box).toHaveText("+");
    await expect(box).toHaveClass(/next/);
    // A passivity event should appear in timeline
    await expect(page.locator("#timeline .entry-box").first()).toContainText("PB");
  });
});

// ── Scenario 3: 0 → R → 1 ───────────────────────────────────────────────────

test.describe("Scenario 3: 0 then R then 1", () => {
  test("pressing 0 shows '0' with neutral background", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("0");

    const box = nextEventBox(page);
    await expect(box).toHaveText("0");
    await expect(box).toHaveClass(/next/);
    await expect(box).not.toHaveClass(/red/);
    await expect(box).not.toHaveClass(/blue/);
  });

  test("pressing R after 0 shows '0R' with red background and blue indicator", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("0");
    await page.keyboard.press("r");

    // Entry-box should be a caution box with red coloring
    const box = nextEventBox(page);
    await expect(box).toHaveClass(/caution/);
    await expect(box).toHaveClass(/red/);

    // First caution-row shows the cautioned side: "0R"
    await expect(page.locator("#next-event .caution-row").first()).toHaveText("0R");

    // Second caution-row shows the opponent indicator: "B"
    await expect(page.locator("#next-event .caution-row").nth(1)).toHaveText("B");
    await expect(page.locator("#next-event .caution-row").nth(1)).toHaveClass(/blue/);
  });

  test("pressing 1 after 0 R records caution and resets next-event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("0");
    await page.keyboard.press("r");
    await page.keyboard.press("1");

    const box = nextEventBox(page);
    await expect(box).toHaveText("+");
    await expect(box).toHaveClass(/next/);
    // Caution for red, 1 point for blue
    await expect(page.locator("#score-blue")).toHaveText("1");
  });
});

// ── Scenario 4: B → 0 → (R ignored) → 2 ────────────────────────────────────

test.describe("Scenario 4: B then 0 then R (ignored) then 2", () => {
  test("pressing B shows 'B' with blue background", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("b");

    const box = nextEventBox(page);
    await expect(box).toHaveText("B");
    await expect(box).toHaveClass(/blue/);
    await expect(box).not.toHaveClass(/next/);
  });

  test("pressing 0 after B shows '0B' with red indicator", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("b");
    await page.keyboard.press("0");

    const box = nextEventBox(page);
    await expect(box).toHaveClass(/caution/);
    await expect(box).toHaveClass(/blue/);

    // First caution-row: cautioned side "0B"
    await expect(page.locator("#next-event .caution-row").first()).toHaveText("0B");

    // Second caution-row: opponent indicator "R"
    await expect(page.locator("#next-event .caution-row").nth(1)).toHaveText("R");
    await expect(page.locator("#next-event .caution-row").nth(1)).toHaveClass(/red/);
  });

  test("pressing R after B 0 is ignored (display unchanged)", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("b");
    await page.keyboard.press("0");
    await page.keyboard.press("r"); // should be ignored

    // Display should still show the 0B caution state
    const box = nextEventBox(page);
    await expect(box).toHaveClass(/caution/);
    await expect(box).toHaveClass(/blue/);
    await expect(page.locator("#next-event .caution-row").first()).toHaveText("0B");
  });

  test("pressing 2 after B 0 records caution and resets next-event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("b");
    await page.keyboard.press("0");
    await page.keyboard.press("r"); // ignored
    await page.keyboard.press("2");

    const box = nextEventBox(page);
    await expect(box).toHaveText("+");
    await expect(box).toHaveClass(/next/);
    // Caution for blue, 2 points for red
    await expect(page.locator("#score-red")).toHaveText("2");
  });
});

// ── Edge cases ───────────────────────────────────────────────────────────────

test.describe("Edge cases", () => {
  test("Escape clears buffer and resets next-event to '+'", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("r");
    // Buffer has ['r'], next-event shows 'R' in red
    const box = nextEventBox(page);
    await expect(box).toHaveText("R");

    await page.keyboard.press("Escape");

    await expect(box).toHaveText("+");
    await expect(box).toHaveClass(/next/);
  });

  test("Complete point sequence resets next-event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("1");
    await page.keyboard.press("b");

    const box = nextEventBox(page);
    await expect(box).toHaveText("+");
    await expect(box).toHaveClass(/next/);
  });

  test("Single digit in buffer shows digit with neutral background", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("4");

    const box = nextEventBox(page);
    await expect(box).toHaveText("4");
    await expect(box).toHaveClass(/next/);
    await expect(box).not.toHaveClass(/red/);
    await expect(box).not.toHaveClass(/blue/);
  });

  test("R then 0 buffer shows '0R' with red background and blue indicator", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("r");
    await page.keyboard.press("0");

    const box = nextEventBox(page);
    await expect(box).toHaveClass(/caution/);
    await expect(box).toHaveClass(/red/);
    await expect(page.locator("#next-event .caution-row").first()).toHaveText("0R");
    await expect(page.locator("#next-event .caution-row").nth(1)).toHaveText("B");
  });

  test("T in buffer shows 'T' with neutral background", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");

    const box = nextEventBox(page);
    await expect(box).toHaveText("T");
    await expect(box).toHaveClass(/next/);
  });

  test("TT opens time modification modal and resets next-event", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);

    await page.keyboard.press("t");
    await expect(nextEventBox(page)).toHaveText("T");
    await expect(nextEventBox(page)).toHaveClass(/next/);

    await page.keyboard.press("t");
    await expect(page.locator("#time-mod-modal")).toBeVisible();
    await expect(nextEventBox(page)).toHaveText("+");
    await expect(nextEventBox(page)).toHaveClass(/next/);
  });

  test("next-event is absent after scoresheet is completed", async ({ page }) => {
    await page.goto(BASE_URL);
    await releaseScoresheet(page);
    // Transition to Completing
    await page.keyboard.press("F4");
    // Transition to Completed (fill minimal form and press F4)
    const winnerSelect = page.locator("#compl-winner");
    await winnerSelect.selectOption({ index: 1 });
    await page.keyboard.press("F4");

    await expect(page.locator("#next-event")).not.toBeVisible();
  });
});
