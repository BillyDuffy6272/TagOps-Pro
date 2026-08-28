import { defineConfig, devices } from '@playwright/test'

// Smoke coverage only, and only what's honestly reachable without a real
// Google OAuth session: the signed-out Landing/Login flow. There's no way
// to fake a Supabase session here — a crafted JWT would pass the client's
// own "am I logged in" check but fail signature validation on every real
// Supabase query, so it wouldn't actually prove anything. Everything past
// sign-in (Tags, Settings, etc.) still relies on manual click-through and
// review, same as today — see 08-test-plan.md for what this suite does
// and doesn't cover.
export default defineConfig({
  testDir: './tests/smoke',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
