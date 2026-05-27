# Variable — Example Record

The `purchase_value` variable, which reads the order total from the datalayer at runtime.

| VariableId | ContainerId | VariableName | VariableType | DefaultValue |
|---|---|---|---|---|
| VARID_AG_0001 | CNTID_AG_0001 | purchase_value | datalayer | 0 |

## Notes

- `ContainerId` references the container in `04-container.md`.
- `VariableName = purchase_value` is the snake_case identifier referenced inside the Tag's Parameters in `05-tag.md` as `{{purchase_value}}`.
- `VariableType = datalayer` means the value is pulled from `dataLayer.purchase_value` at runtime. If the variable is missing or undefined, `DefaultValue = 0` is used so the tag still fires (with zero value) rather than failing silently.
- `VariableName` must be unique inside the container — the application enforces this at submission AND the database enforces it via a partial UNIQUE index (security floor #5).
