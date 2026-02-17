import { expect, test } from '@playwright/test'

test('game loads and a group can be solved', async ({ page }) => {
  await page.goto('/?date=2026-02-17')

  await expect(page.getByTestId('tile-grid')).toBeVisible()

  await page.getByTestId('tile-i1').click()
  await page.getByTestId('tile-i2').click()
  await page.getByTestId('tile-i3').click()
  await page.getByTestId('tile-i4').click()

  await page.getByTestId('submit-guess-button').click()

  await expect(page.getByTestId('found-group-g-yellow')).toBeVisible()
  await expect(page.getByTestId('guess-history')).toBeVisible()
})

