# 02 - Requirements

## **Tracking Organisation + Operational Tool for Business Owners**

### MUST HAVE / MVP (In Scope)

---

- Organisation for Tags, Triggers, Conversion events, Variables
    - Drop down menus to easily pick them
    - Link a container to a Google Ads conversion ID and generate ready-to-paste tracking code (gtag.js / GTM dataLayer) for each conversion event
- An intutive User Interface
    - Easy naviagation and easy to understand interface
- Make an account under 2 mins using Google
- Secure and confidential account
- Put all actual setup info into the website in 10 mins
- Create or join an Organisation 
    - Join via a shareable invite code, not just being manually added
    - Regenerate the invite code on demand — immediately invalidates the old one
- Rename an Organisation (owner only)
- Add people to an Organisation
- Remove people from the Organisation
    - Add an expiry date for people
- All initial data load into the website after linking 
- Readable + easily viewable text 
- Be able to see if the account is properly linked to the Google Account and accurately showing the information in their Google Account
- Different user roles to limit + provide access to the Organisation accordingly for each user 
    - Owner, Admin, Editor and Viewer, each with genuinely different access — Editor+ can create/edit, Viewer is read-only
    - A Viewer can request to be upgraded to Editor; an Owner or Admin approves or denies it

---
### WOULD BE NICE / Extras 

---
- Verify if Tag setup is operational + running
    - Check each individual Tag of setup not just generally
- Pickup on errors in the setup
- Preview mode for datalayer inspection to be used in Tags
- Be able to view specific tag, trigger, variables, conversion events in more detail for each individual tag, trigger, or conversion event
- Change the theme of the website for user preference
- View small summary information for each tag, trigger, variable, conversion event before expanding
- Contrast with menu and dashboard for optimal user viewing 
- See where a user is in terms of which page they are on
- Home page that shows all what the different pages refer to
    - Collapsible, so it doesn't clutter the page for returning users
- Search / filter tags, triggers, variables and conversion events by name
- A marketing/landing page explaining the product before sign-in, rather than going straight to the Google sign-in screen
- Keyboard navigation and screen-reader support (labels, focus states, live-region announcements for loading/error/empty states)
---
### Out of scope

---

- Ai suggestions to add Tracking tags to the setup
    - Credit system to prevent over-use
- Verify if Tag setup is operational + running
    - Check each individual Tag of setup not just generally
- Pickup on errors in the setup
- Changes made in this convert and are actually implemented on these softwares 
    - On that note to be able to actually make changes not simply view it
- Preview mode for datalayer inspection to be used in Tags
- Sync changes made in Google softwares relay and update in my website (and visa versa)
- Suggestions for business owners to include other info if missing or if they need to actually add this
- Be able to contact support services w/ any issues that arise
    - Sponsered by my Business Need Tracking potentially
- Add users to containers as part of the organisation
    - Don't know how this would work as they would need to be added via Google
- Conversion-event tracking with real Google Ads data
    - Built, then removed — needs the Google Ads API's own developer token, an external approval process with no guaranteed timeline. See `decision-log.md` ADR-0038.

---
> Note (added 28/08/2026): Preview mode for dataLayer inspection is listed here as out of scope, but also under Would Be Nice above — it ended up being built (see `07-evaluation.md`). Leaving both original lines as written rather than editing them; this note just flags the overlap.

> Note (added 28/08/2026): Conversion-event tracking (the "Conversion events" line under MUST HAVE / MVP above, and its own line under WOULD BE NICE) was built, then removed entirely — code, database tables, and this line's UI — for the reason in the new "Out of scope" bullet above. Leaving the original MVP/WOULD BE NICE lines as written rather than editing them, matching the convention set by the note above; the removal is recorded properly in `decision-log.md` ADR-0038 and `ai-use-log.md`.

> Note (added 28/08/2026): Four lines added above after auditing the live app against this doc and finding real, shipped features that were never written down here — invite-code regeneration and organisation renaming (both MUST HAVE), and a landing page plus accessibility support (both WOULD BE NICE). Added as new lines rather than backfilled into the original Week 2 list, consistent with this doc's convention of not rewriting history.