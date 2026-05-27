# Tag–Trigger Link — Example Record

The row that wires the GA4 Purchase Event tag to its firing trigger.

| TagId | TriggerId | Relationship |
|---|---|---|
| TAGID_AG_0001 | TRGID_AG_0001 | fires_on |

## Notes

- `TagId` references the tag in `05-tag.md`.
- `TriggerId` references the trigger in `06-trigger.md`.
- `Relationship = fires_on` means the tag is activated by this trigger. A second row with `Relationship = blocks` could exist for the same `TagId` pointing at a different `TriggerId`, e.g., "do not fire when the user is an internal staff member" — that pattern lets a single tag have multiple firing triggers and multiple blocking triggers without bloating the Tag table.
- The application validates that `TagId.ContainerId == TriggerId.ContainerId` before saving — you cannot wire a tag in one container to a trigger in another.
- The primary key is the composite `(TagId, TriggerId, Relationship)`.
