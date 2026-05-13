# 01 - Problem Statement

> **Context.** TagOps-Pro is being built as my Year 12 Software Engineering AT3 project at Noetica Academy (Term 2, 2026). The product vision below is genuine and the goal is a working v1 by Week 9; the project is also subject to the school's mandated stack (Vercel + Supabase + Claude Code + VS Code), nine-week timeline, security floor, and folio requirements. See `CLAUDE.md` for the full project constraints.

## **TagOps-Pro: Tracking Organisation + Operational Tool for Business Owners**

### The Problem

Most small and mid-sized business owners depend on web analytics and marketing tracking (Google Tag Manager, GA4, Meta Pixel, conversion events, etc.) to make decisions, run ads, and measure ROI — yet the tools that produce this data are built for technical implementers, not for the people who actually own the business outcomes.

In practice, this creates four recurring pains:

1. **Tracking sprawl with no source of truth.** Tags, triggers, variables, and conversion events accumulate across GTM containers, GA4 properties, ad platforms, and CRMs. Nobody — including the owner — has a single, readable view of what is being tracked, where, and why.
2. **Setup is slow and error-prone.** A new tag or conversion event often requires hopping between platforms, copy-pasting IDs, and remembering naming conventions. Mistakes (wrong trigger, broken datalayer reference, duplicate events) are easy to make and hard to spot.
3. **Verification is manual and unreliable.** Owners rarely know whether a given tag is actually firing in production. Confirming this today means opening preview mode, tailing the datalayer, or paying an agency to audit it.
4. **Collaboration and handover are painful.** Adding a freelancer, agency, or new staff member to a tracking stack typically means sharing Google credentials, with no way to scope access, expire it, or audit what they changed.

### Who This Is For

- **Primary user:** A business owner or operator who is responsible for tracking outcomes but is not a developer. They have ad accounts, a website, and "some tags set up somewhere," and they want control without becoming a GTM expert.
- **Secondary user:** Freelancers, marketing managers, and small agencies who manage tracking on behalf of clients and need a cleaner way to organise, verify, and hand things back.

### What "Solved" Looks Like

A business owner can:

- Sign up with Google in under 2 minutes.
- Get their existing tracking setup logged in TagOps-Pro within 10 minutes.
- See every tag, trigger, conversion event, and variable in one organised view with dropdown navigation.
- Invite a teammate or contractor with an expiry date, and remove them in one click.
- Receive contextual suggestions when something looks incomplete, and reach support when something breaks.

### Why Now

Tracking has become more — not less — important as cookie deprecation, server-side tagging, and consent rules raise the cost of getting it wrong. At the same time, AI now makes it realistic to offer non-technical owners assistive suggestions ("you probably want a purchase conversion here"), automated verification ("this tag has not fired in 7 days"), and natural-language explanations of what their setup actually does — capabilities that previously required a paid consultant.

### Out of Scope (for MVP)

- Two-way sync with Google Tag Manager / GA4 (read-only logging only in MVP; full sync is a roadmap item).
- AI-generated tag creation and credit metering (roadmap).
- Automated firing/health verification per tag (roadmap).
- Datalayer preview mode (roadmap).

See `02-requirements.md` for the detailed MUST-HAVE and WOULD-BE-NICE feature lists.
