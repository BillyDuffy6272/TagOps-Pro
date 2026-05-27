# Container — Example Record

The main marketing site for Need Tracking, linked to a real GTM container.

| ContainerId | OrganisationId | ContainerName | Domain | Environment | GtmContainerId |
|---|---|---|---|---|---|
| CNTID_AG_0001 | ORGID_AG_0001 | Main marketing site | need-tracking.com | production | GTM-AB12CD3 |

## Notes

- `OrganisationId` references the org in `02-organisation.md`.
- All Tags, Triggers, Variables, and Conversion Events in this folder reference this `ContainerId`.
- Because `Environment = production`, any write operation against the linked GTM container requires an explicit user confirmation per the tracking-platform safety rules in `CLAUDE.md`. A `sandbox` value would allow writes freely.
- `GtmContainerId` is `NULL` until the user actually links their GTM account (roadmap feature — read-only in MVP).
