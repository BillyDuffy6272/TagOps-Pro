# Organisation — Example Record

The example organisation owned by Alex G.

| OrganisationId | OrganisationName | OrganisationSlug | OwnerId | CreatedAt |
|---|---|---|---|---|
| ORGID_AG_0001 | Need Tracking | need-tracking | USRID_AG_0001 | 2026-05-13T04:00:00Z |

## Notes

- `OwnerId` references the user in `01-user.md` (`USRID_AG_0001`).
- The `XX` portion of every child ID in this folder (`_AG_`) is derived from this organisation's two-letter code.
- The slug `need-tracking` is what shows up in URLs (e.g., `tagops.pro/o/need-tracking/containers`).
- When this row was created, a Postgres trigger automatically inserted `MEMID_AG_0001` in `organisation_members` — see `03-membership.md`.
