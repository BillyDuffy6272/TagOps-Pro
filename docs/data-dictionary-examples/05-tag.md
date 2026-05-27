# Tag — Example Record

A GA4 event tag that sends a `purchase` event to Google Analytics when a customer completes checkout.

| TagId | ContainerId | TagName | TagType | TagStatus | Parameters | Notes |
|---|---|---|---|---|---|---|
| TAGID_AG_0001 | CNTID_AG_0001 | GA4 Purchase Event | ga4_event | active | `{"measurement_id": "G-XXXXXXX", "event_name": "purchase", "value": "{{purchase_value}}", "currency": "AUD"}` | Fires after the Stripe webhook confirms the order. Value pulled from the datalayer at the thank-you page. |

## Notes

- `ContainerId` references the container in `04-container.md`.
- `{{purchase_value}}` inside Parameters is a reference to the variable in `07-variable.md` (matched on `VariableName`). At runtime the variable is resolved to the actual datalayer value.
- `TagType = ga4_event` means the application validates the Parameters object against the GA4 event schema — `measurement_id` and `event_name` are required keys.
- The trigger that fires this tag is recorded in `09-tag-trigger-link.md`.
