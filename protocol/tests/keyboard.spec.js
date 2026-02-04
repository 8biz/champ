import { test, expect } from '@playwright/test'

const url = 'file://' + process.cwd() + '/protocol/protocol.html'

test('keyboard: record R2 and show last event', async ({ page }) => {
  await page.goto(url)
  await page.keyboard.press('r')
  await page.keyboard.press('2')
  const last = page.locator('#lastEvent')
  await expect(last).toHaveText('R2')
  const items = page.locator('#events li')
  await expect(items).toHaveCount(1)
  await expect(items.nth(0)).toHaveText('0: R2')
})

test('keyboard: R0 2 (caution) with ignored key', async ({ page }) => {
  await page.goto(url)
  await page.keyboard.press('r')
  await page.keyboard.press('0')
  await page.keyboard.press('x') // ignored
  await page.keyboard.press('2')
  await expect(page.locator('#lastEvent')).toHaveText('R02B')
})

test('keyboard: escape clears buffer and does not add event', async ({ page }) => {
  await page.goto(url)
  await page.keyboard.press('r')
  await expect(page.locator('#buffer')).toHaveText('R')
  await page.keyboard.press('Escape')
  await expect(page.locator('#buffer')).toHaveText('')
  await expect(page.locator('#events li')).toHaveCount(0)
})

test('correction: change last R2 to B1', async ({ page }) => {
  await page.goto(url)
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
  await expect(page.locator('#events li').nth(0)).toHaveText('0: B1')
})

test('space toggles bout time', async ({ page }) => {
  await page.goto(url)
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
