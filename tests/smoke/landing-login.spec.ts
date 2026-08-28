import { expect, test } from '@playwright/test'

// Everything a signed-out visitor can reach: Landing → Login → back to
// Landing (App.tsx's showLogin toggle). Nothing past this point is
// testable here without a real Google OAuth session — see
// playwright.config.ts and 08-test-plan.md for why.

test('Landing renders and leads into the real Login screen', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Google Tag Manager')
  await expect(page.getByRole('button', { name: 'Get started' }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Get started' }).first().click()

  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible()
  await expect(page.getByText('read-only access to your Google Tag Manager')).toBeVisible()
})

test('Login\'s logo returns to Landing', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Get started' }).first().click()
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible()

  await page.getByRole('button', { name: 'TagOps Pro' }).click()

  await expect(page.getByRole('button', { name: 'Get started' }).first()).toBeVisible()
})

test('no console errors on the signed-out Landing/Login flow', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('/')
  await page.getByRole('button', { name: 'Get started' }).first().click()
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible()

  expect(errors).toEqual([])
})
