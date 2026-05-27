# Data Dictionary — Worked Examples

One file per entity, each holding populated example records, to show what real data would look like in TagOps-Pro. Useful for sanity-checking the field shapes in `../04-data-model.md` against concrete values.

These are mockups, not production data. They will be tweaked for optimisation, performance, and security in Weeks 5–6.

## Layout convention

Each file uses a **row-per-record** table: the header row lists the field names and each subsequent row is one populated record. This matches the format the records would take in a CSV export (one CSV per entity, header row of fields, one row per record).

## The scenario

All examples share one internally consistent scenario, so every foreign-key reference lines up:

- **Alex G** (`USRID_AG_0001`) signs up and creates the organisation **Need Tracking** (`ORGID_AG_0001`). A Postgres trigger automatically creates Alex's owner membership row (`MEMID_AG_0001`) at the same instant.
- A teammate, **Jordan T** (`USRID_AG_0002`), is invited as an editor with a 90-day expiry. Their membership row is `MEMID_AG_0002`.
- The organisation has one container — the main marketing site **need-tracking.com** (`CNTID_AG_0001`), linked to GTM container `GTM-AB12CD3`.
- Inside that container:
  - One **variable**: `purchase_value` (`VARID_AG_0001`), pulling from the datalayer.
  - One **trigger**: `Purchase complete` (`TRGID_AG_0001`), listening for the custom event `purchase` on the `/checkout/thank-you` page.
  - One **tag**: `GA4 Purchase Event` (`TAGID_AG_0001`), which fires on the Purchase complete trigger and sends `purchase_value` to GA4.
  - One **conversion event**: `purchase` (`CONID_AG_0001`), counted as a business outcome.
- One **tag-trigger link** wires the tag to the trigger with `Relationship = fires_on`.

## Files

- [`01-user.md`](01-user.md) — both User records (the owner and the teammate).
- [`02-organisation.md`](02-organisation.md) — the Need Tracking organisation.
- [`03-membership.md`](03-membership.md) — both Membership rows (the auto-created owner row and the teammate row with expiry).
- [`04-container.md`](04-container.md) — the need-tracking.com container.
- [`05-tag.md`](05-tag.md) — the GA4 Purchase Event tag.
- [`06-trigger.md`](06-trigger.md) — the Purchase complete trigger.
- [`07-variable.md`](07-variable.md) — the `purchase_value` variable.
- [`08-conversion-event.md`](08-conversion-event.md) — the `purchase` conversion event.
- [`09-tag-trigger-link.md`](09-tag-trigger-link.md) — the link row connecting the tag to its trigger.
