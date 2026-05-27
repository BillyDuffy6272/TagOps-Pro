# Membership — Example Records

The owner's own membership row (created automatically when the organisation is created), plus a teammate invited as an editor with a 90-day expiry. This is where the "expiry date for people" requirement lives.

| MembershipId | OrganisationId | UserId | Role | JoinedAt | ExpiresAt |
|---|---|---|---|---|---|
| MEMID_AG_0001 | ORGID_AG_0001 | USRID_AG_0001 | owner | 2026-05-13T04:00:00Z | _(empty — owners cannot expire)_ |
| MEMID_AG_0002 | ORGID_AG_0001 | USRID_AG_0002 | editor | 2026-05-13T05:12:00Z | 2026-08-11T05:12:00Z |

## Notes

- `MEMID_AG_0001` is the owner row for Alex G. It is created automatically by a Postgres trigger at the moment the organisation is inserted, so the owner satisfies the `is_active_org_member()` RLS check for their own org from the very first request. Without this row, the owner would be locked out of their own data.
- `MEMID_AG_0002` is the teammate row for Jordan T. `ExpiresAt` is 90 days after `JoinedAt`. Once `now() > ExpiresAt`, the RLS policy returns `false` and Jordan can no longer read or write rows in this organisation, but the row itself stays (so the audit history is preserved).
- A database `CHECK` constraint enforces that `Role = 'owner'` rows must have `ExpiresAt = NULL`.
- `OrganisationId` on both rows references the org in `02-organisation.md`; `UserId` references the corresponding row in `01-user.md`.
