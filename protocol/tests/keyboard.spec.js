import { test, expect } from '@playwright/test'

const base = 'file://' + process.cwd() + '/protocol/protocol.html'

test('keyboard: record R2 and show last event with metadata', async ({ page }) => {
  await page.goto(base)
  await page.keyboard.press('r')
  await page.keyboard.press('2')
  const last = page.locator('#lastEvent')
  await expect(last).toHaveText('R2')
  const items = page.locator('#events li')
  await expect(items).toHaveCount(1)
  // should include period 0 and score 2-0
  await expect(items.nth(0)).toHaveText(/0: R2 .* \(p0\) .*2-0/)
  // data-bouttime should be '0' (event immediately after start)
  const bt = await items.nth(0).getAttribute('data-bouttime')
  expect(Number(bt)).toBe(0)
  // timestamp should be ISO
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
  await expect(page.locator('#events li').nth(0)).toHaveText(/R02B .* \(p0\) .*0-2/)
})

test('keyboard: escape clears buffer and does not add event', async ({ page }) => {
  await page.goto(base)
  await page.keyboard.press('r')
  await expect(page.locator('#buffer')).toHaveText('R')
  await page.keyboard.press('Escape')
  await expect(page.locator('#buffer')).toHaveText('')
  await expect(page.locator('#events li')).toHaveCount(0)
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
  await expect(page.locator('#events li').nth(0)).toHaveText(/0: B1 .* \(p0\) .*1-0/)
})

test('period end: automatic PERIOD_END and next period starts with 0-0', async ({ page }) => {
  // use short period to make test fast
  await page.goto(base + '?period=2&periods=2')
  const items = page.locator('#events li')
  await page.keyboard.press('Space')
  // wait for period to expire (2s)
  await page.waitForTimeout(2500)
  await expect(items).toHaveCount(1)
  await expect(items.nth(0)).toHaveText(/PERIOD_END .* \(p0\)/)
  const bt0 = await items.nth(0).getAttribute('data-bouttime')
  expect(Number(bt0)).toBe(2)

  // now create a new event in period 1
  await page.keyboard.press('r')
  await page.keyboard.press('1')
  await expect(items).toHaveCount(2)
  await expect(items.nth(1)).toHaveText(/R1 .* \(p1\) .*1-0/)
  const bt1 = await items.nth(1).getAttribute('data-bouttime')
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
