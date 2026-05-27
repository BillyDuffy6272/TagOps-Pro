# Trigger — Example Record

The trigger that fires when a customer reaches the thank-you page after a successful purchase.

| TriggerId | ContainerId | TriggerName | TriggerType | EventName | Conditions |
|---|---|---|---|---|---|
| TRGID_AG_0001 | CNTID_AG_0001 | Purchase complete | custom_event | purchase | `[{"var": "page_path", "op": "contains", "val": "/checkout/thank-you"}]` |

## Notes

- `ContainerId` references the container in `04-container.md`.
- `TriggerType = custom_event` means this trigger listens for a `dataLayer.push({event: 'purchase', ...})` from the website code.
- The single Condition narrows firing to the thank-you URL, so a developer pushing the event from a debug page in staging does not accidentally count as a conversion.
- This trigger is wired to the tag in `05-tag.md` via the link row in `09-tag-trigger-link.md`.
