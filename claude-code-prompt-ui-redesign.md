# Prompt: Redesign TagOps-Pro's UI in the style of Linear (linear.app)

> Paste this whole prompt into Claude Code in the TagOps-Pro repo root.

## Role and constraints

You are working in the TagOps-Pro repo. Read `CLAUDE.md` first and follow it exactly — in particular:

- This is a visual/presentational redesign only. Do not change Supabase queries, RLS, `src/lib/supabase.ts`, `src/lib/gtm.ts`, any `api/` files, or any `types.ts`. Functionality, props, data flow, and routing must behave identically before and after.
- Adding Tailwind CSS is a new dependency and an architectural change. Before installing anything, add an entry to `docs/decision-log.md` proposing "Adopt Tailwind CSS for styling" with a one-paragraph rationale (Linear-style redesign, utility-first speeds up iteration, replaces ad hoc per-component CSS files). I already approved this — go ahead and install after logging it, don't stop and ask again.
- Use Tailwind v4's Vite plugin (`@tailwindcss/vite`), not the old PostCSS/`tailwind.config.js` v3 setup — this project is on Vite 8 with Rolldown, and the v4 plugin is the simpler, currently-recommended path. Confirm the installed Tailwind version supports this before assuming it.
- Feature-folder structure stays as-is (`src/features/<feature>/components/...`). Don't reorganize folders as part of this pass.
- TypeScript strict mode stays on — no `any`, no `@ts-ignore` without a comment.
- After the redesign, propose an entry in `docs/ai-use-log.md` summarizing this session (prompt, what was generated, what was accepted/modified).
- Run `npm run lint` and `npm run build` (this repo has no `typecheck` script — `build` runs `tsc -b` first) before declaring the work done. Fix anything that breaks.

## Design brief: what "Linear-style" means here

Reference: https://linear.app (marketing site and, if you can picture it, the app itself). Recreate the *feeling*, not literal Linear branding/logo/copy. Keep the current dark theme and the existing teal accent (`#2dd4bf`) — do not switch to Linear's purple. The brief is about layout, spacing, typography, motion, and component polish, not recoloring.

Specific traits to bring over:

1. **Near-black, layered dark surfaces.** Linear uses very dark, almost-black backgrounds with subtly *lighter* panels floating on top (sidebar vs. content vs. cards each get a slightly different shade), rather than flat single-color panels with hard borders everywhere. Keep this project's existing dark navy palette (`#080c14`, `#0d1120`, `#1a2035` etc.) as the base, but formalize it into a small set of CSS custom-property tokens (background/surface/surface-raised/border/border-subtle, text-primary/secondary/tertiary, accent, accent-muted) defined once in `src/index.css` and reused everywhere instead of hardcoded hex values scattered across component CSS files.
2. **Hairline borders, not heavy ones.** Borders should be 1px, low-opacity white (`rgba(255,255,255,0.06–0.08)`), used sparingly — prefer subtle background-shade differences and soft shadows over visible borders to separate elements.
3. **Soft elevation, not drop-shadows everywhere.** Cards and modals get a subtle shadow/glow on hover or when active, not a constant heavy box-shadow.
4. **Generous, consistent spacing and 8–10px radii.** Linear's UI feels dense but not cramped — consistent 4/8/12/16/24px spacing scale, rounded corners around 8–10px on cards, buttons, inputs, and modals (not fully rounded, not sharp).
5. **Typography restraint.** Inter is already loaded — keep it. Headings should be slightly tighter letter-spacing and a clear size/weight hierarchy (e.g. 13px body, 12–13px secondary text, 15–16px section titles, 500/600 weight — avoid bold-everywhere). Muted secondary text should use a clearly dimmer token, not just a slightly different gray.
6. **Fast, subtle motion.** Hover/focus transitions around 120–160ms ease, on color/background/border only (no bouncy or slow animations). Nav items, buttons, and cards should feel responsive, not decorative.
7. **Minimal, functional iconography.** 16px icons, consistent stroke width, no icon without a clear purpose (matches what's already in Sidebar.tsx — just make sizing/alignment consistent).
8. **Sidebar treatment.** Compact width, icon+label nav items with a subtle left-accent or background highlight for the active item (this repo already does this in `Sidebar.css` — refine spacing/hover states, don't reinvent the pattern), clear separation between nav, footer/user area.
9. **Empty states and modals feel considered.** Centered, generous padding, a short helpful message, one clear primary action — not a bare "no data" text.
10. **Accessible focus states.** Every interactive element (buttons, nav items, form inputs, modal close buttons) needs a visible keyboard focus ring using the accent color — Linear is keyboard-first, and this repo's current CSS mostly only styles `:hover`, not `:focus-visible`.

## Scope — redesign the whole app in one pass

Touch every one of these (styling/markup only, keep all logic, props, and Supabase calls untouched):

- `src/index.css` — establish the CSS custom-property token system described above; keep the existing Google Fonts import.
- `src/App.css`, `src/App.tsx`
- `src/components/AppShell.tsx` / `AppShell.css`
- `src/components/Sidebar.tsx` / `Sidebar.css`
- `src/components/TagCard.tsx` / `TagCard.css`
- `src/components/TagDetailModal.tsx` / `TagDetailModal.css`
- `src/pages/Login.tsx` / `Login.css`
- `src/pages/Dashboard.tsx` / `Dashboard.css`
- `src/features/home/components/HomeView.tsx` / `HomeView.css`
- `src/features/tags/components/TagsView.tsx` / `TagsView.css`
- `src/features/triggers/components/TriggersView.tsx` / `TriggersView.css`, `TriggerCard.tsx` / `TriggerCard.css`
- `src/features/variables/components/VariablesView.tsx` / `VariablesView.css`, `VariableCard.tsx` / `VariableCard.css`
- `src/features/conversions/components/ConversionsView.tsx` / `ConversionsView.css`, `ConversionCard.tsx` / `ConversionCard.css`, `ConversionFormModal.tsx` / `ConversionFormModal.css`

For each file: migrate the styling to Tailwind utility classes in the `.tsx`, pull repeated multi-utility strings (per this repo's existing convention of "extract when a class string repeats more than twice or grows past ~6 utilities") into small helper components or `class-variance-authority`-free constants — don't add new styling libraries beyond Tailwind itself. Delete the corresponding `.css` file once its styles are fully migrated, unless something in it can't reasonably move to Tailwind (e.g. the `@import` for fonts, which stays in `index.css`).

## Process

1. Read `docs/02-requirements.md` and `docs/06-front-end-architecture.md` if it exists, to check for any UI requirements you'd otherwise violate.
2. Add the `decision-log.md` entry for Tailwind adoption, then install `tailwindcss` and `@tailwindcss/vite`, wire it into `vite.config.ts` and `src/index.css`.
3. Define the design tokens in `src/index.css` (as CSS custom properties, consumed via Tailwind's `@theme` in v4) before touching any component.
4. Redesign `AppShell` + `Sidebar` first (the app's skeleton), then work outward to each feature view, then modals, then `Login`/`Dashboard`.
5. After each feature area, run `npm run lint` and fix any issues before moving to the next — don't batch all fixes to the end.
6. Run `npm run build` at the end and resolve any TypeScript or build errors.
7. Summarize what changed per file in your final response, and propose the `docs/ai-use-log.md` entry text for me to review.

Ask me before making any change outside this scope (e.g. if you think a behavioral change is needed to make the design work).
