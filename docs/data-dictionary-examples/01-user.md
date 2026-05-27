# User — Example Records

The owner of the example organisation, plus the teammate invited as an editor.

| UserId | Email | DisplayName | AvatarUrl | Password | CreatedAt |
|---|---|---|---|---|---|
| USRID_AG_0001 | alex@need-tracking.com | Alex G | https://lh3.googleusercontent.com/a/example-avatar | _Handled by Supabase Auth — never stored in our database (security floor #6)._ | 2026-05-13T04:00:00Z |
| USRID_AG_0002 | jordan.t@example.com | Jordan T | https://lh3.googleusercontent.com/a/example-avatar-2 | _Handled by Supabase Auth — never stored in our database (security floor #6)._ | 2026-05-13T05:10:00Z |

## Notes

- `USRID_AG_0001` is the organisation owner, referenced in `02-organisation.md` as `OwnerId` and in `03-membership.md` as the owner membership row.
- `USRID_AG_0002` is the teammate referenced in `03-membership.md`. They were created when accepting the invitation (which is why `CreatedAt` is two minutes before their `JoinedAt`).
- Email verification must succeed before either user can access any organisation (security floor #4).
- Internally, both rows mirror `auth.users` entries; the `UserId` shown here is the readable display ID, and the database primary key is a UUID.
