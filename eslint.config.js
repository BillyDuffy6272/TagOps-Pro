import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Edge Functions run on Deno, not Node/the browser — global `Deno`,
  // remote-URL imports, and Deno's own lint/fmt tooling apply there
  // instead of this (Vite/Node-targeted) config.
  globalIgnores(['dist', 'supabase/functions']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Flags the fetch-on-mount pattern (setLoading(true) inside a data
      // effect) used by every GTM-backed view. The real fix is moving server
      // state to TanStack Query (see docs/decision-log.md); until then the
      // rule fights the standard pattern rather than catching bugs.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
