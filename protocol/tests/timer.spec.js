import { test, expect } from "@playwright/test";

test("Countdown startet bei 3:00 und zählt herunter", async ({ page }) => {
  await page.goto("file://" + process.cwd() + "/protocol/protocol.html");

  const display = page.locator("#display");
  const boutTimeButton = page.locator("#bout-time-button");

  await expect(display).toHaveText("3:00");

  await boutTimeButton.click();
  await page.waitForTimeout(1100);

  await expect(display).toHaveText("2:59");

  await boutTimeButton.click();
  const stopped = await display.textContent();

  await page.waitForTimeout(1100);
  await expect(display).toHaveText(stopped);
});
