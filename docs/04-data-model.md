# Data Dictionarys

> **Status: Week 2 draft.** This file lives under the AT3 slot for `04-data-model.md` and currently holds the **data dictionary** (one row per field, grouped by entity). The schema diagram (ERD), the SQL migrations, and the full Row-Level Security policy text are added in Weeks 5–6 (IU12SE-015). A condensed **Suggested Structure** section at the bottom shows how the fields below group into database tables and how the security floor maps onto them.

---

## How to read this

Each section below corresponds to one entity (User, Organisation, Tag, etc.). The table inside that section lists every field on that entity with seven columns:

- **Variable** — the field name as used in code and the UI.
- **Data Type** — the underlying type (string, int, boolean, timestamp, JSON object/array).
- **Format** — the shape the value takes (an ID pattern, a dropdown, free text, ISO 8601, etc.).
- **Description** — what the field means in plain English.
- **Example** — a concrete value.
- **Connected to** — what other field or entity this links to. `(PK)` marks the primary key for that entity.
- **Validation** — the rule applied at form submission AND at the database level (per security floor #5).

---

## ID format convention

User-facing identifiers follow the pattern `PREFIX_XX_YYYY`:

- `PREFIX` — entity type (e.g., `TAGID`, `TRGID`, `VARID`, `CONID`, `USRID`, `ORGID`, `CNTID`, `MEMID`).
- `XX` — two-letter organisation code (e.g., `AG` for the first organisation owned by user "Alex G").
- `YYYY` — zero-padded sequential number, per entity type, per organisation (`0001` upwards).

Internally the database uses UUIDs as primary keys (Supabase convention); the readable `PREFIX_XX_YYYY` values are stored alongside as `display_id` for use in the UI, exports, and conversations with the user. See the Suggested Structure section.

---

## User

| Variable | Data Type | Format | Description | Example | Connected to | Validation |
|---|---|---|---|---|---|---|
| UserId | string | USRID_XX_YYYY | Unique identifier for a user. | USRID_AG_0001 | (PK) | System-generated; matches a Supabase Auth user. |
| Email | string | name@domain.tld | Email address used for sign-in and invitations. | alex@example.com | UserId | Valid email format; must be verified before access (security floor #4). |
| DisplayName | string | Free text | Friendly name shown in the UI. | Alex G | UserId | 1–80 characters; first letter of each word capitalised. |
| AvatarUrl | string | URL | Profile image from OAuth provider, if available. | https://lh3.googleusercontent.com/a/... | UserId | Valid URL when present; optional. |
| Password | — | — | Handled by Supabase Auth — **never stored in our database** (security floor #6). | •••••••• | UserId | Supabase Auth enforces minimum length and complexity. |
| CreatedAt | timestamp | ISO 8601 | When the user account was created. | 2026-05-13T04:00:00Z | UserId | System-generated. |

---

## Organisation

| Variable | Data Type | Format | Description | Example | Connected to | Validation |
|---|---|---|---|---|---|---|
| OrganisationId | string | ORGID_XX_YYYY | Unique identifier for an organisation. | ORGID_AG_0001 | (PK) | System-generated. |
| OrganisationName | string | Free text | Display name. | Need Tracking Pty Ltd | OrganisationId | 1–100 characters. |
| OrganisationSlug | string | lowercase-hyphenated | URL-safe identifier (used in deep links). | need-tracking | OrganisationId | 2–60 characters; lowercase letters, digits, hyphens; unique across the platform. |
| OwnerId | string | USRID_XX_YYYY | The user who created the organisation; ultimate authority. | USRID_AG_0001 | User.UserId | Must reference a valid UserId. |
| CreatedAt | timestamp | ISO 8601 | When the organisation was created. | 2026-05-13T04:00:00Z | OrganisationId | System-generated. |

---

## Membership

A user belongs to an organisation through a Membership row. This is where the "expiry date for people" requirement lives.

| Variable | Data Type | Format | Description | Example | Connected to | Validation |
|---|---|---|---|---|---|---|
| MembershipId | string | MEMID_XX_YYYY | Unique identifier for a membership row. | MEMID_AG_0001 | (PK) | System-generated. |
| OrganisationId | string | ORGID_XX_YYYY | The organisation the user belongs to. | ORGID_AG_0001 | Organisation.OrganisationId | Must reference a valid OrganisationId. |
| UserId | string | USRID_XX_YYYY | The user who is a member. | USRID_AG_0002 | User.UserId | Must reference a valid UserId; a user appears at most once per organisation. |
| Role | string | Dropdown | Permission level inside the organisation. | editor | MembershipId | One of: `owner`, `admin`, `editor`, `viewer`. |
| JoinedAt | timestamp | ISO 8601 | When the user accepted the invitation. | 2026-05-13T04:00:00Z | MembershipId | System-generated. |
| ExpiresAt | timestamp | ISO 8601 (optional) | When access auto-revokes. Empty = no expiry. | 2026-08-13T04:00:00Z | MembershipId | If set, must be later than JoinedAt. |

---

## Container

A Container represents one tracking deployment (typically one website or app). All Tags, Triggers, Variables, and Conversion Events live inside a Container.

| Variable | Data Type | Format | Description | Example | Connected to | Validation |
|---|---|---|---|---|---|---|
| ContainerId | string | CNTID_XX_YYYY | Unique identifier for a tracking container. | CNTID_AG_0001 | (PK) | System-generated. |
| OrganisationId | string | ORGID_XX_YYYY | The organisation that owns this container. | ORGID_AG_0001 | Organisation.OrganisationId | Must reference a valid OrganisationId. |
| ContainerName | string | Free text | Display name (e.g., the site's nickname). | Main marketing site | ContainerId | 1–100 characters. |
| Domain | string | URL host | Primary domain being tracked. | example.com | ContainerId | Valid hostname when present; optional. |
| Environment | string | Dropdown | Deployment context. Controls whether writes to a real GTM container are allowed. | production | ContainerId | One of: `production`, `staging`, `sandbox`. |
| GtmContainerId | string | GTM-XXXXXX | External GTM container reference. Empty until the GTM integration is linked (roadmap). | GTM-AB12CD3 | (External — Google Tag Manager) | Pattern check when present. |

---

## Tag

A Tag is the master definition of what to send and when.

| Variable | Data Type | Format | Description | Example | Connected to | Validation |
|---|---|---|---|---|---|---|
| TagId | string | TAGID_XX_YYYY | Unique identifier for a tag. | TAGID_AG_0001 | (PK) | System-generated. |
| ContainerId | string | CNTID_XX_YYYY | The container this tag lives in. | CNTID_AG_0001 | Container.ContainerId | Must reference a valid ContainerId. |
| TagName | string | Free text | Human-readable name. | GA4 Purchase Event | TagId | 1–150 characters; unique within the container. |
| TagType | string | Dropdown | What kind of tag this is. | ga4_event | TagId | One of: `ga4_event`, `ga4_config`, `meta_pixel`, `floodlight`, `custom_html`. |
| TagStatus | string | Dropdown | Lifecycle state. | active | TagId | One of: `draft`, `active`, `paused`, `archived`. |
| Parameters | JSON object | JSON | Tag-type-specific configuration. | `{"event_name": "purchase", "value": "{{purchase_value}}"}` | TagId | Must be a valid JSON object; keys validated against TagType. |
| Notes | string | Free text | Owner's notes for context. | Fires after Stripe webhook confirms. | TagId | Optional. |

---

## Trigger

A Trigger defines the conditions under which one or more Tags fire.

| Variable | Data Type | Format | Description | Example | Connected to | Validation |
|---|---|---|---|---|---|---|
| TriggerId | string | TRGID_XX_YYYY | Unique identifier for a trigger. | TRGID_AG_0001 | (PK) | System-generated. |
| ContainerId | string | CNTID_XX_YYYY | The container this trigger lives in. | CNTID_AG_0001 | Container.ContainerId | Must reference a valid ContainerId. |
| TriggerName | string | Free text | Human-readable name. | Purchase complete | TriggerId | 1–150 characters; unique within the container. |
| TriggerType | string | Dropdown | What event the trigger listens for. | custom_event | TriggerId | One of: `pageview`, `click`, `custom_event`, `form_submit`, `scroll`, `timer`, `history_change`. |
| EventName | string | snake_case | For `custom_event` triggers, the datalayer event name to match. | purchase | TriggerId | Required when TriggerType = `custom_event`; otherwise empty. |
| Conditions | JSON array | JSON | Filter clauses applied to the trigger. | `[{"var":"page_path","op":"contains","val":"/checkout"}]` | TriggerId | Valid JSON array of clause objects. |

---

## Variable

A Variable is a named reference to a value pulled from the page, the URL, the datalayer, or elsewhere. Variables are reused inside Tag parameters and Trigger conditions.

| Variable | Data Type | Format | Description | Example | Connected to | Validation |
|---|---|---|---|---|---|---|
| VariableId | string | VARID_XX_YYYY | Unique identifier for a variable. | VARID_AG_0001 | (PK) | System-generated. |
| ContainerId | string | CNTID_XX_YYYY | The container this variable lives in. | CNTID_AG_0001 | Container.ContainerId | Must reference a valid ContainerId. |
| VariableName | string | snake_case | Identifier-style name used in Tag parameters. | purchase_value | VariableId | Letters, digits, underscores; cannot start with a digit; unique within the container. |
| VariableType | string | Dropdown | Where the value comes from. | datalayer | VariableId | One of: `datalayer`, `constant`, `url`, `cookie`, `dom_element`, `custom_js`. |
| DefaultValue | string | Free text | Fallback used if the value cannot be resolved at runtime. | 0 | VariableId | Optional. |

---

## Conversion Event

A Conversion Event marks a specific event name as a business outcome (purchase, lead, signup) and ties it to an optional monetary value.

| Variable | Data Type | Format | Description | Example | Connected to | Validation |
|---|---|---|---|---|---|---|
| ConversionEventId | string | CONID_XX_YYYY | Unique identifier for a conversion event. | CONID_AG_0001 | (PK) | System-generated. |
| ContainerId | string | CNTID_XX_YYYY | The container this conversion event lives in. | CNTID_AG_0001 | Container.ContainerId | Must reference a valid ContainerId. |
| EventName | string | snake_case | The event name that should count as a conversion. | purchase | ConversionEventId | Letters, digits, underscores; cannot start with a digit; unique within the container. |
| ValueParam | string | snake_case | Variable name carrying the monetary value of the conversion. | purchase_value | Variable.VariableName | Must reference an existing Variable in the same container; optional. |
| Currency | string | ISO 4217 | Three-letter currency code. | AUD | ConversionEventId | Exactly 3 uppercase letters. |
| IsActive | boolean | true / false | Whether this conversion is currently counted. | true | ConversionEventId | Required. |

---

## Tag–Trigger link

Tags connect to Triggers through a link row. A tag can have many firing triggers and many blocking triggers.

| Variable | Data Type | Format | Description | Example | Connected to | Validation |
|---|---|---|---|---|---|---|
| TagId | string | TAGID_XX_YYYY | The tag in this relationship. | TAGID_AG_0001 | Tag.TagId | Must reference a valid TagId. |
| TriggerId | string | TRGID_XX_YYYY | The trigger in this relationship. | TRGID_AG_0001 | Trigger.TriggerId | Must reference a valid TriggerId in the same Container as the Tag. |
| Relationship | string | Dropdown | Whether this trigger fires the tag or blocks it. | fires_on | (composite PK with TagId + TriggerId + Relationship) | One of: `fires_on`, `blocks`. |

---

## Suggested structure

The fields above implement as the following Supabase Postgres tables. Internal primary keys are UUIDs (Supabase convention); the `PREFIX_XX_YYYY` values in the data dictionary are surfaced through a `display_id` column on each table.

| Table | What it stores | Primary key | Notable foreign keys |
|---|---|---|---|
| `users` | Mirror of `auth.users` with display info | uuid (= `auth.users.id`) | — |
| `organisations` | Tenant boundary | uuid | `owner_id` → `users` |
| `organisation_members` | Membership with role and `expires_at` | uuid | `organisation_id`, `user_id` |
| `invitations` | Pending invites | uuid | `organisation_id`, `invited_by` |
| `containers` | Tracking containers | uuid | `organisation_id` |
| `tags` | Tag definitions | uuid | `container_id`, `organisation_id` |
| `triggers` | Trigger definitions | uuid | `container_id`, `organisation_id` |
| `variables` | Variable definitions | uuid | `container_id`, `organisation_id` |
| `conversion_events` | Conversion-event registry | uuid | `container_id`, `organisation_id` |
| `tag_triggers` | Many-to-many Tag↔Trigger link | composite (`tag_id`, `trigger_id`, `relationship`) | `tag_id` → `tags`, `trigger_id` → `triggers` |
| `audit_log` | Append-only record of meaningful changes | uuid | `organisation_id`, `actor_id` |

**Cross-cutting conventions** that apply to every domain table:

- Every domain row carries `organisation_id`. RLS uses it as the membership check, so a single helper function `is_active_org_member(org_id)` covers all tables.
- User-content tables (`tags`, `triggers`, `variables`, `conversion_events`, `containers`) use soft delete (`deleted_at`) so a misclick is recoverable.
- `created_at`, `updated_at`, `created_by`, `updated_by` audit columns on every user-editable table; `updated_at` is maintained by a Postgres trigger.

**Row-Level Security pattern**, satisfying security-floor requirement #2:

```sql
-- Membership check used by every policy
create function is_active_org_member(org_id uuid) returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from organisation_members
    where organisation_id = org_id
      and user_id = auth.uid()
      and (expires_at is null or expires_at > now())
  );
$$;

-- Example policy on tags
create policy "members read" on tags
  for select using (is_active_org_member(organisation_id));
```

Write policies layer a role check on top (`editor` and above can insert/update; `viewer` is read-only). Full policy text is added in Week 5–6 alongside the migrations.

**Roadmap entities** (not in MVP, included so the schema does not paint us into a corner):

- `integrations` — OAuth tokens for GTM and GA4 APIs, stored encrypted via Supabase Vault (security floor #6).
- `ai_suggestions` + `credit_ledger` — for the metered AI tag-suggestion feature.
- `firing_events` — observed tag fires, for automated verification.

---

## Open questions (to resolve in Week 5–6)

- **`display_id` generation.** Sequential `YYYY` numbers need a per-org counter — a Postgres sequence keyed by `(organisation_id, entity_type)` or a trigger that computes `max() + 1` on insert? The sequence approach is faster but creates gaps; the trigger approach has no gaps but is slower under contention.
- **GTM container linkage model.** One TagOps-Pro container per GTM container, or mirror GTM's workspace/version model? Leaning one-to-one for MVP.
- **Audit-log retention.** How long do we keep audit rows before archiving? Free-tier Supabase storage is finite.
- **Filename: `decisions.md` vs `decision-log.md`.** Tracked in `decision-log.md`; mentioned here because future ADR references in this doc need to use the agreed name.

---

_Last updated: 2026-05-13 (Week 2 draft data dictionary). Schema diagram, RLS policy text, and migration plan added in Weeks 5–6._
