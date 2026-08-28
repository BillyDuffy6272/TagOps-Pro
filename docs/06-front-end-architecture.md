# 06 - Front-End Architecture

## Component tree

```
App                                  session bootstrap (Supabase getSession + onAuthStateChange)
└── Dashboard                        membership gate (loading / no-org / error / found)
    ├── OrganisationOnboarding       shown when the user has no organisation_members row yet
    └── AppShell                     GtmProvider + Sidebar + TopBar + routed view
        ├── Sidebar                  nav, active-view highlight, sign out
        ├── TopBar                   current view's title
        └── <ActiveView>             one of:
            ├── HomeView             workspace overview, "what each page shows" guide
            ├── TagsView             GTM tags (read-only, live)
            ├── TriggersView         GTM triggers (read-only, live)
            ├── VariablesView        GTM variables (read-only, live)
            ├── ConversionsView      Supabase-backed conversion-event documentation
            ├── PreviewView          local dataLayer/tag-firing simulator
            ├── SettingsView         profile, team management, appearance
            └── OrganisationView     org details, invite code (owner/admin)
```

Feature folders (`src/features/<feature>/`) own their view, modals, API calls, and types together — e.g. `src/features/conversions/` has its own `components/`, `api/conversions.ts`, `lib/snippets.ts`, and `types.ts`, rather than those being scattered across shared `components/`/`api/`/`types/` folders by kind. `src/components/` is the exception: it's cross-feature, presentational-only UI with no feature ownership — `Modal`, `EntityRow`, `Sidebar`, `TopBar`, `LoadingState`, `ErrorBanner`, `EmptyState`, and the detail modals for each entity type all live there because more than one feature uses them. `tags` and `home` are the two feature folders without an `api/` — `home` is a static landing view with no data of its own, and `tags` currently talks to `src/lib/gtm.ts` directly rather than through its own `api/` module, which is a minor inconsistency against the other four data-driven features.

## State management

Today, state is local `useState` plus a hand-written `useCallback` fetch-and-load function per view (`loadTags`, `loadConversions`, etc.), each followed by a `useEffect` that calls it on mount. This pattern is duplicated near-verbatim across `TagsView`, `TriggersView`, `VariablesView`, `PreviewView`, and `ConversionsView` — the same shape (`setSyncing(true)` → fetch → `catch` a 403 into `gtmForbidden` or a generic error → `finally setSyncing(false)`) appears five times. `CLAUDE.md`'s coding conventions call for TanStack Query hooks for exactly this reason, but the dependency isn't installed yet — it's tracked as open debt rather than done, and adding it is a deliberate architectural change that needs its own decision, not something to slip in incidentally.

The one genuine app-wide context is `GtmContext` (`src/lib/GtmContext.tsx`): it owns the selected GTM account/container once, at the `AppShell` level, specifically so that switching sidebar sections doesn't drop the selection or refetch the same account/container list redundantly. `ThemeContext` is the other context, holding the light/dark/system choice. Neither is a general-purpose store — both exist to solve one specific "this state needs to survive a re-render of its consumer" problem, which is the right scope for React context; a broader client-state library (`CLAUDE.md` names Zustand as the candidate) hasn't been needed yet.

## Styling

Tailwind CSS v4, utility classes written inline per convention, with one addition that makes theming possible without a second stylesheet: `src/index.css` defines a `@theme` block of CSS custom properties (`--color-canvas`, `--color-text-primary`, `--color-success`, etc.), redefined under `@media (prefers-color-scheme: light)` and again under explicit `[data-theme="light"]`/`[data-theme="dark"]` selectors. Because Tailwind v4 generates utilities directly from `--color-*` custom properties, a single utility name like `bg-canvas` or `text-text-primary` automatically resolves to the correct value for whichever theme is active — components never branch on theme themselves. `ThemeContext` holds the `light | dark | system` choice, persists it to `localStorage`, and applies it via a `data-theme` attribute set on `<html>` synchronously in `main.tsx`, before the first paint, to avoid a flash of the wrong theme (ADR-0027).

One convention violation worth naming rather than hiding: `CLAUDE.md` says to extract a shared component once a class string repeats more than twice, and a `SELECT_CLASSES` Tailwind string is currently duplicated verbatim across three files (`TriggersView.tsx`, `VariablesView.tsx`, `ContainerPicker.tsx`) with a near-identical fourth variant in `MemberRow.tsx`. It's tracked, not yet extracted.

## Routing

There is no router library. `AppShell.tsx` holds an `ActiveView` union type (`'home' | 'tags' | 'triggers' | ...`) in a single `useState`, and a `switch` statement renders the matching view — clicking a sidebar item just calls `setActiveView`. This means there's no URL per page and no deep-linking to, say, a specific settings tab. This is current-state fact, not a confirmed permanent decision — `CLAUDE.md` names React Router or TanStack Router as candidates for an ADR before adding one, and that ADR hasn't been written yet.

## Accessibility

**Implemented today:** every form input uses a real `<label htmlFor>`/`<input id>` pair, including `<select>`s; interactive card rows (`EntityRow.tsx`) use `role="button"` + `tabIndex={0}` + explicit `Enter`/`Space` keydown handling rather than a bare clickable `<div>`; `focus-visible` rings are applied consistently across buttons, inputs, and tab controls without suppressing the default outline; loading, error, and empty states announce to assistive tech via `role="status"`/`role="alert"`/`aria-live` (`LoadingState.tsx`, `ErrorBanner.tsx`, `EmptyState.tsx`, `GtmForbiddenState.tsx`); all four search inputs carry an `aria-label` since their only visible label is placeholder text; the active sidebar item carries `aria-current="page"`; and the heading hierarchy is a clean h1 (page title) → h2 (each entity row's title, `EntityRow.tsx`) → h3 (inside the Home page's expandable guide) with no skipped level.

**Known, open gaps** — named here deliberately rather than left to be found: the shared `Modal.tsx` component, which backs all eight of the app's modals, has no `role="dialog"`, `aria-modal`, focus trap, focus return on close, or Escape-to-close. A full rewrite closing all of that was implemented and verified during the 27/08/2026 audit, then explicitly reverted at the project owner's request rather than kept — a deliberate scope call, not an oversight, but the underlying gap is real and unaddressed. Separately, the `--color-text-tertiary`/`--color-text-faint` tokens (and the light-mode `success`/`warning` status colors) fall slightly short of WCAG AA's 4.5:1 contrast minimum in places — a fix for this was also implemented and verified, then reverted the same way. Both remain open items for a future pass.

## Data flow specifics worth noting

`src/lib/gtm.ts` caches GTM API responses for a short TTL to avoid redundant calls when multiple views need the same account/container list within a short window; `GtmContext.refresh()` explicitly clears that cache and bumps a `refreshKey` that every view's fetch effect depends on, so a manual refresh actually reaches the network rather than serving a stale cache hit. This is the one piece of "caching logic" in the app outside of what the browser or Supabase already does, and it exists specifically because GTM data is fetched directly from Google on every view rather than mirrored locally.
