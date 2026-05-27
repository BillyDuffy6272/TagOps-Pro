# Conversion Event — Example Record

Marks the `purchase` event as a business outcome, with the monetary value carried by the `purchase_value` variable.

| ConversionEventId | ContainerId | EventName | ValueParam | Currency | IsActive |
|---|---|---|---|---|---|
| CONID_AG_0001 | CNTID_AG_0001 | purchase | purchase_value | AUD | true |

## Notes

- `ContainerId` references the container in `04-container.md`.
- `EventName = purchase` matches the `EventName` of the trigger in `06-trigger.md` — the same string drives the trigger AND flags the event as a conversion. (This is intentional: in GA4 the event name itself is the contract.)
- `ValueParam = purchase_value` references the variable in `07-variable.md` by name. The application validates that a variable with this name exists in the same container before allowing the row to be saved.
- `Currency = AUD` is an ISO 4217 code — three uppercase letters, validated at form submission and via a database `CHECK` constraint.
- `IsActive = true` means this conversion is currently counted. Turning it off (without deleting the row) is useful when migrating analytics platforms.
