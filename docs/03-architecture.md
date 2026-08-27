# 03 - Architecture

> **Status: template, not yet written.** Slotted for Weeks 3–4 (IU12SE-013/014). This file should end up describing the high-level design: how the pieces fit together, what happens when a request is made, and the diagrams that explain both. The italic prompts under each heading say what belongs there — replace them with your own writing and delete the prompt once a section is done.

---

## System overview

*One or two paragraphs: what are the moving pieces (Vercel-hosted React app, Supabase for auth/database/RLS, the Google APIs the app talks to directly) and how do they relate? Say explicitly that there's no separate backend server — Supabase's auto-generated PostgREST API plus RLS policies stand in for one.*

*Worth naming directly: this app talks to **two different backends** from the browser — your own Supabase project (organisations, teams, conversion events) and Google's Tag Manager/GA4 APIs (read-only, via the OAuth token from sign-in). That split is a defining feature of the architecture, not an implementation detail — it's why there's no "sync" step and why GTM data is never stored in your own database.*

## Architecture diagram

*A diagram (a simple box-and-arrow one is fine — hand-drawn/photographed, or a Mermaid diagram in a fenced ```mermaid block, which GitHub and most markdown viewers render) showing: Browser → Vercel (static React build) → Supabase (Auth / Postgres+RLS / Storage if used), and Browser → Google APIs (Tag Manager API, GA4 Admin/Data API) directly, authenticated via the Google OAuth token issued at sign-in.*

## Request lifecycle — walk through one real example

*Pick one concrete user action and trace it end to end, layer by layer. Two good candidates, since they exercise the two different backends:*

*1. **Loading the Tags page** — user clicks "Tags" → `TagsView` component → `src/lib/gtm.ts` calls the Tag Manager API directly with the session's `provider_token` → Google returns the container's tags → rendered in `TagCard`/`EntityRow`. Note what's NOT involved: no Supabase table stores this, so "loading tags" always reflects the live GTM container.*

*2. **Adding a team member** — `AddMemberModal` → `src/features/settings/api/settings.ts` → `supabase-js` → PostgREST → Postgres, where the INSERT is checked against the `organisation_members` RLS policy before it's allowed to commit. Worth naming that RLS check as an explicit step in the diagram/description — it's the actual enforcement point, not just a nice-to-have.*

## Key architectural decisions

*Summarise the ones that shaped the system, with a one-line "why," and link to the full reasoning in `decision-log.md` rather than repeating it: light/dark theming via CSS token-swap (ADR-0027), self-service org invite codes via `SECURITY DEFINER` functions (ADR-0023), GTM/GA4 kept strictly read-only. Pick the 3–5 decisions a marker would actually want explained here.*

## Deployment / CI-CD

*Vercel's continuous deployment from the git repo — what triggers a deploy, where environment variables/secrets live (Vercel project settings, never committed), and what `supabase/migrations/` vs the live Supabase project's state means for deploys (migrations aren't auto-applied by Vercel — say how they actually get run).*

## Trade-offs and constraints

*What did the mandated stack (no separate backend, Supabase-only) rule out or make harder? What would you do differently with a blank slate, and why didn't you here — timeline, scope, or a genuine belief it's the better trade-off?*
