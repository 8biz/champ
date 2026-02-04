import { test, expect } from '@playwright/test'

const base = 'file://' + process.cwd() + '/protocol/protocol.html'

test('keyboard: record R2 and show last event with metadata', async ({ page }) => {
  await page.goto(base)
  await page.keyboard.press('r')
  await page.keyboard.press('2')
  const last = page.locator('#lastEvent')
  await expect(last).toHaveText('R2')
  const items = page.locator('#timeline .slot:not(.next-slot)')
  await expect(items).toHaveCount(1)
  // check data attributes: bouttime 0, score 2-0
  const bt = await items.nth(0).getAttribute('data-bouttime')
  expect(Number(bt)).toBe(0)
  const score = await items.nth(0).getAttribute('data-score')
  expect(score).toBe('2-0')
  const ts = await items.nth(0).getAttribute('data-timestamp')
  expect(ts).toMatch(/\d{4}-\d{2}-\d{2}T.+Z/)
})

test('keyboard: R0 2 (caution) with ignored key', async ({ page }) => {
  await page.goto(base)
  await page.keyboard.press('r')
  await page.keyboard.press('0')
  await page.keyboard.press('x') // ignored
  await page.keyboard.press('2')
  await expect(page.locator('#lastEvent')).toHaveText('R02B')
  const slot = page.locator('#timeline .slot:not(.next-slot)').nth(0)
  const score = await slot.getAttribute('data-score')
  expect(score).toBe('0-2')
  const bt = await slot.getAttribute('data-bouttime')
  expect(Number(bt)).toBe(0)
})

test('keyboard: escape clears buffer and does not add event', async ({ page }) => {
  await page.goto(base)
  await page.keyboard.press('r')
  await expect(page.locator('#buffer')).toHaveText('R')
  await page.keyboard.press('Escape')
  await expect(page.locator('#buffer')).toHaveText('')
  await expect(page.locator('#timeline .slot:not(.next-slot)')).toHaveCount(0)
})

test('correction: change last R2 to B1 and keep metadata updated', async ({ page }) => {
  await page.goto(base)
  // create an event
  await page.keyboard.press('r')
  await page.keyboard.press('2')
  await expect(page.locator('#lastEvent')).toHaveText('R2')

  // enter correction mode (ArrowLeft selects last slot)
  await page.keyboard.press('ArrowLeft')
  // change to B1
  await page.keyboard.press('b')
  await page.keyboard.press('1')
  // confirm
  await page.keyboard.press('Enter')

  // now event should be changed
  await expect(page.locator('#lastEvent')).toHaveText('B1')
  const changed = page.locator('#timeline .slot:not(.next-slot)').nth(0)
  const score = await changed.getAttribute('data-score')
  expect(score).toBe('1-0')
  const bt = await changed.getAttribute('data-bouttime')
  expect(Number(bt)).toBe(0)
})

test('click slot enters correction mode and allows edit', async ({ page }) => {
  await page.goto(base)
  // create an event
  await page.keyboard.press('r')
  await page.keyboard.press('2')
  const slot = page.locator('#timeline .slot:not(.next-slot)').nth(0)
  await slot.click()
  // slot should show cursor class
  const classAttr = await slot.getAttribute('class')
  expect(classAttr).toMatch(/cursor/)
  // change to B1 and confirm
  await page.keyboard.press('b')
  await page.keyboard.press('1')
  await page.keyboard.press('Enter')
  await expect(page.locator('#lastEvent')).toHaveText('B1')
})

test('period end: automatic PERIOD_END and next period starts with 0-0', async ({ page }) => {
  // use short period to make test fast
  await page.goto(base + '?period=2&periods=2')
  await page.keyboard.press('Space')
  // wait for period to expire (2s)
  await page.waitForTimeout(2500)
  // PERIOD_END slot should be present
  const endSlots = page.locator('#timeline .period-end')
  await expect(endSlots).toHaveCount(1)
  await expect(endSlots.nth(0)).toContainText('PERIOD_END')
  const bt0 = await endSlots.nth(0).getAttribute('data-bouttime')
  expect(Number(bt0)).toBe(2)

  // now create a new event in period 1
  await page.keyboard.press('r')
  await page.keyboard.press('1')
  const slots = page.locator('#timeline .slot:not(.next-slot)')
  await expect(slots).toHaveCount(2)
  const second = slots.nth(1)
  const score = await second.getAttribute('data-score')
  expect(score).toBe('1-0')
  const bt1 = await second.getAttribute('data-bouttime')
  expect(Number(bt1)).toBe(0)
})

test('space toggles bout time', async ({ page }) => {
  await page.goto(base)
  const display = page.locator('#display')
  await expect(display).toHaveText('3:00')
  await page.keyboard.press('Space')
  await page.waitForTimeout(1100)
  await expect(display).toHaveText('2:59')
  await page.keyboard.press('Space')
  const stopped = await display.textContent()
  await page.waitForTimeout(1100)
  await expect(display).toHaveText(stopped)
})
