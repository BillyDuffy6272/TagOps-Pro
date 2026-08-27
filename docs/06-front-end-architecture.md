# 06 - Front-End Architecture

> **Status: template, not yet written.** Slotted for Weeks 6–7 (IU12SE-016). Covers how the UI is actually put together: the component tree, the styling approach, state management, and accessibility. Replace each italic prompt with your own writing.

---

## Component tree / folder structure

*Explain the feature-folder convention actually used (`src/features/<feature>/{components,api,types.ts}`) over a technical-layer split, with a real example — e.g. `src/features/conversions/` owns its own view, modals, API calls, and types together rather than scattering them across `components/`, `api/`, `types/` folders by kind. List the current top-level features (home, tags, triggers, variables, conversions, settings, organisation, preview) and what each owns. Note `src/components/` separately — it's cross-feature, presentational-only (`Modal`, `EntityRow`, `Sidebar`, etc.), not tied to one feature.*

## State management

*What's actually used today — local component state (`useState`) plus hand-written `useCallback` data-loaders per view — versus what `CLAUDE.md` designates for later (TanStack Query for server state, Zustand for small global stores). Say honestly that the TanStack Query migration is still open (tracked in `decision-log.md`), what that costs today (near-identical fetch-orchestration logic duplicated across `TagsView`/`TriggersView`/`VariablesView`/`PreviewView`/`ConversionsView`), and what it would look like once done.*

## Styling approach

*Tailwind CSS v4, utility classes inline per `CLAUDE.md`'s convention. The more interesting part to explain: this app doesn't hardcode colors — `src/index.css` defines a `@theme` block of CSS custom properties (`--color-canvas`, `--color-text-primary`, `--color-success`, etc.), redefined per theme under `prefers-color-scheme`/`[data-theme]`, so a single set of Tailwind utility names (`bg-canvas`, `text-text-primary`) automatically resolves to the right value in light or dark mode. `ThemeContext.tsx` holds the light/dark/system choice and applies it via a `data-theme` attribute on `<html>`. Reference `decision-log.md` ADR-0027 for why this approach was chosen over a second stylesheet.*

## Routing

*State plainly what's true today: there's no router library — `AppShell`'s `ActiveView` state switches which feature view renders, there's no URL-per-page. Is that a deliberate MVP scope call, or an open item? Say which, and if it's open, name it as a candidate for an ADR before adding React Router or TanStack Router (per `CLAUDE.md`).*

## Accessibility approach

*What's actually implemented, with file references: forms use real `<label htmlFor>`/`<input id>` pairs, interactive rows (`EntityRow.tsx`) use `role="button"` + `tabIndex={0}` + Enter/Space keyboard handling rather than a bare clickable `<div>`, `focus-visible` rings are applied consistently, loading/error/empty states announce via `role="status"`/`role="alert"`/`aria-live`, and the four search inputs carry `aria-label`.*

*Be equally honest about what's still open — a marker who spot-checks will find these regardless, and naming them yourself reads better than having them found for you: the shared `Modal.tsx` component (used by all 8 modals) doesn't yet have `role="dialog"`, a focus trap, focus return on close, or Escape-to-close; and the `--color-text-tertiary`/`--color-text-faint` tokens (plus the light-mode success/warning status colors) fall slightly short of WCAG AA 4.5:1 contrast in places. Say whether these are deliberately deferred (and why) or genuinely still to do.*
