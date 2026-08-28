/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // tests/smoke/ uses @playwright/test, not Vitest — run via `npm run
    // test:smoke`, never picked up here even if someone runs bare `vitest`.
    exclude: ['**/node_modules/**', 'tests/smoke/**'],
  },
})
