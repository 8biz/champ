import { test, expect } from "@playwright/test";
import { BASE_URL } from "./helpers.js";

// ── Portrait Viewport (360×600) ─────────────────────────────────────────────

test.describe("CHAMP Protocol - Portrait Viewport 360×600", () => {
  test.use({ viewport: { width: 360, height: 600 } });

  test("scoresheet fits within 360×600 viewport without horizontal overflow", async ({ page }) => {
    await page.goto(BASE_URL);

    // Check that no element inside the app overflows beyond the viewport right edge.
    // (The .app has overflow:hidden, so scrollWidth only reflects the app's own overflow,
    // not the body's scroll. We use getBoundingClientRect to detect clipped content.)
    const overflowingElements = await page.evaluate(() => {
      const viewport = window.innerWidth;
      return Array.from(document.querySelectorAll("#app, #app *"))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.right > viewport + 1;
        })
        .map(el => ({ id: el.id, tag: el.tagName, right: Math.round(el.getBoundingClientRect().right) }));
    });
    expect(overflowingElements).toHaveLength(0);
  });

  test("all event buttons are visible within 360×600 viewport", async ({ page }) => {
    await page.goto(BASE_URL);

    const buttons = page.locator(".event-btn");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toBeInViewport();
    }
  });

  test("event buttons are at least as wide as they are tall", async ({ page }) => {
    await page.goto(BASE_URL);

    const buttons = page.locator(".event-btn");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(box.height - 1); // allow 1px rounding
    }
  });
});
