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

/** Toggle the bout timer via the Space key (start if stopped, stop if running). */
export async function toggleTimer(page) {
  await page.keyboard.press(" ");
}

/**
 * Return the current full app state snapshot from the browser-side test helper.
 * Prefer this over direct `page.evaluate(() => window.testHelper.getState())` calls.
 * @returns {Promise<object>}
 */
export async function getAppState(page) {
  return page.evaluate(() => window.testHelper.getState());
}

/**
 * Generate and return the export data object via the browser-side export helper.
 * Prefer this over direct `page.evaluate(() => window.exportHelper.generate())` calls.
 * @returns {Promise<object>}
 */
export async function generateExport(page) {
  return page.evaluate(() => window.exportHelper.generate());
}

/**
 * Return the injury timer state for a given key ('IR', 'IB', 'BR', 'BB').
 * @param {import('@playwright/test').Page} page
 * @param {'IR'|'IB'|'BR'|'BB'} key
 * @returns {Promise<{running: boolean, time100ms: number}>}
 */
export async function getInjuryTimerState(page, key) {
  return (await getAppState(page)).injuryTimers[key];
}

/**
 * Return the activity timer state for a given key ('AR', 'AB').
 * @param {import('@playwright/test').Page} page
 * @param {'AR'|'AB'} key
 * @returns {Promise<{active: boolean, time100ms: number, seq: *}>}
 */
export async function getActivityTimerState(page, key) {
  return (await getAppState(page)).activityTimers[key];
}

/**
 * Returns a locator for all recorded (non-next-event) timeline entries.
 * @param {import('@playwright/test').Page} page
 */
export function timelineEntries(page) {
  return page.locator(".timeline .entry:not(#next-event)");
}
