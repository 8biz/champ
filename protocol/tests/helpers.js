export const BASE_URL = "file://" + process.cwd() + "/protocol/protocol.html";

/** Release the scoresheet for recording (F4 from New → Recording). */
export async function releaseScoresheet(page) {
  await page.keyboard.press("F4");
}

/**
 * Set the remaining bout (period) time via the TT time-modification modal.
 * @param {import('@playwright/test').Page} page
 * @param {string} remainingTime  Remaining period time in "M:SS" format
 */
export async function setBoutTime(page, remainingTime) {
  await page.keyboard.press("t");
  await page.keyboard.press("t");
  const input = page.locator("#time-mod-input");
  await input.fill(remainingTime);
  await input.press("Enter");
}

/**
 * Set bout time then record a bout event via keyboard.
 * @param {import('@playwright/test').Page} page
 * @param {string} remainingTime  Remaining period time in "M:SS" format
 * @param {string[]} keys         Key presses for the event, e.g. ["1","B"]
 */
export async function recordEventAtTime(page, remainingTime, keys) {
  await setBoutTime(page, remainingTime);
  for (const key of keys) {
    await page.keyboard.press(key);
  }
}

/** Locates the primary entry-box inside #next-event. */
export function nextEventBox(page) {
  // For caution sequences there are inner .caution-row elements; the
  // outer .entry-box is still the first child.
  return page.locator("#next-event .entry-box").first();
}
