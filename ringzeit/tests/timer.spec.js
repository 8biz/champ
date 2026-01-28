import { test, expect } from "@playwright/test";

test("Countdown startet bei 3:00 und zählt herunter", async ({ page }) => {
  await page.goto("file://" + process.cwd() + "/ringzeit.html");

  const display = page.locator("#display");
  const startButton = page.locator("#start");
  const stopButton = page.locator("#stop");

  await expect(display).toHaveText("3:00");

  await startButton.click();
  await page.waitForTimeout(1100);

  await expect(display).toHaveText("2:59");

  await stopButton.click();
  const stopped = await display.textContent();

  await page.waitForTimeout(1100);
  await expect(display).toHaveText(stopped);
});
