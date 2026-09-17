import { afterAll, describe, expect, it } from 'vitest'
import { addMember, createContainer, createOrg, createUser, impersonate, impersonateAnon, pool, withRolledBackTransaction } from './helpers'

// Exercises the exact class of bug found twice by manual review (ADR-0029):
// a self-referential RLS subquery that collapses "is this row in MY org" to
// "is this row in ANY org I'm in." Each test impersonates a real user via
// request.jwt.claims + SET LOCAL ROLE authenticated (see helpers.ts), the
// same mechanism PostgREST uses per-request in production — so a policy
// regression here fails exactly the way it would against the live API,
// not a simulation of one.
//
// Requires a local Supabase instance with migrations applied:
//   supabase start
//   npm run test:integration

afterAll(async () => {
  await pool.end()
})

describe('tags — organisation_id INSERT boundary', () => {
  it('rejects inserting a tag tagged with a different organisation\'s id', async () => {
    await withRolledBackTransaction(async client => {
      const ownerA = await createUser(client, 'owner-a')
      const orgA = await createOrg(client, ownerA, 'Org A')
      const editorA = await createUser(client, 'editor-a')
      await addMember(client, orgA, editorA, 'editor')

      const ownerB = await createUser(client, 'owner-b')
      const orgB = await createOrg(client, ownerB, 'Org B')
      const containerB = await createContainer(client, orgB, 'Container B')

      await impersonate(client, editorA)

      await expect(
        client.query(
          `insert into public.tags (display_id, container_id, organisation_id, name, tag_type)
           values ($1, $2, $3, $4, $5)`,
          ['TAGID_TE_9001', containerB, orgA, 'Cross-org tag', 'custom_html']
        )
      ).rejects.toThrow(/row-level security/i)
    })
  })

  it('allows an editor to insert a tag into their own organisation\'s container', async () => {
    await withRolledBackTransaction(async client => {
      const owner = await createUser(client, 'owner')
      const org = await createOrg(client, owner, 'Org')
      const editor = await createUser(client, 'editor')
      await addMember(client, org, editor, 'editor')
      const container = await createContainer(client, org, 'Container')

      await impersonate(client, editor)

      const result = await client.query(
        `insert into public.tags (display_id, container_id, organisation_id, name, tag_type)
         values ($1, $2, $3, $4, $5) returning id`,
        ['TAGID_TE_9002', container, org, 'Same-org tag', 'custom_html']
      )
      expect(result.rowCount).toBe(1)
    })
  })
})

describe('tags — SELECT boundary', () => {
  it('returns no rows for another organisation\'s tags, rather than erroring', async () => {
    await withRolledBackTransaction(async client => {
      const ownerA = await createUser(client, 'owner-a')
      const orgA = await createOrg(client, ownerA, 'Org A')
      const memberA = await createUser(client, 'member-a')
      await addMember(client, orgA, memberA, 'viewer')

      const ownerB = await createUser(client, 'owner-b')
      const orgB = await createOrg(client, ownerB, 'Org B')
      const containerB = await createContainer(client, orgB, 'Container B')
      await client.query(
        `insert into public.tags (display_id, container_id, organisation_id, name, tag_type)
         values ($1, $2, $3, $4, $5)`,
        ['TAGID_TE_9003', containerB, orgB, 'Org B tag', 'custom_html']
      )

      await impersonate(client, memberA)

      const result = await client.query(`select * from public.tags where organisation_id = $1`, [orgB])
      expect(result.rowCount).toBe(0)
    })
  })

  it('returns the row for a tag inside the caller\'s own organisation', async () => {
    await withRolledBackTransaction(async client => {
      const owner = await createUser(client, 'owner')
      const org = await createOrg(client, owner, 'Org')
      const member = await createUser(client, 'member')
      await addMember(client, org, member, 'viewer')
      const container = await createContainer(client, org, 'Container')
      await client.query(
        `insert into public.tags (display_id, container_id, organisation_id, name, tag_type)
         values ($1, $2, $3, $4, $5)`,
        ['TAGID_TE_9004', container, org, 'Own-org tag', 'custom_html']
      )

      await impersonate(client, member)

      const result = await client.query(`select * from public.tags where organisation_id = $1`, [org])
      expect(result.rowCount).toBe(1)
    })
  })
})

describe('organisation_members — the ADR-0029/ADR-0033 cross-tenant bug', () => {
  it('rejects an admin inserting a membership row into a different organisation', async () => {
    await withRolledBackTransaction(async client => {
      const ownerA = await createUser(client, 'owner-a')
      const orgA = await createOrg(client, ownerA, 'Org A')
      const adminA = await createUser(client, 'admin-a')
      await addMember(client, orgA, adminA, 'admin')

      const ownerB = await createUser(client, 'owner-b')
      const orgB = await createOrg(client, ownerB, 'Org B')
      const intruder = await createUser(client, 'intruder')

      await impersonate(client, adminA)

      // The historical bug: an admin of Org A could insert themselves (or
      // anyone) into Org B with any role, including 'owner' — a full
      // cross-tenant takeover. Attempting the most serious form directly.
      await expect(
        client.query(
          `insert into public.organisation_members (display_id, organisation_id, user_id, role)
           values ($1, $2, $3, $4)`,
          ['MEMID_TE_9005', orgB, intruder, 'owner']
        )
      ).rejects.toThrow(/row-level security/i)
    })
  })

  it('rejects an admin updating a membership\'s role to owner', async () => {
    await withRolledBackTransaction(async client => {
      const owner = await createUser(client, 'owner')
      const org = await createOrg(client, owner, 'Org')
      const admin = await createUser(client, 'admin')
      await addMember(client, org, admin, 'admin')
      const editor = await createUser(client, 'editor')
      await addMember(client, org, editor, 'editor')

      await impersonate(client, admin)

      // The row is visible to the admin via USING (they can normally
      // update members in their own org) — it's WITH CHECK's separate
      // `role <> 'owner'` clause that must reject it. Postgres raises an
      // error for a WITH CHECK failure on an otherwise-matched UPDATE row
      // (distinct from USING silently filtering rows out), so this should
      // throw, not silently affect zero rows.
      await expect(
        client.query(`update public.organisation_members set role = 'owner' where user_id = $1`, [editor])
      ).rejects.toThrow(/row-level security/i)
    })
  })
})

describe('conversion_events — container/organisation consistency (ADR-0041)', () => {
  // Found by running this exact suite for the first time (see the
  // 'tags — organisation_id INSERT boundary' failure above): the INSERT
  // WITH CHECK only verified the caller was an editor+ of the
  // organisation_id being written, never that container_id actually
  // belonged to that organisation. Fixed for conversion_events (the table
  // this session restored) in 20260917020000; tags/triggers/variables have
  // the identical, pre-existing gap and are intentionally left alone here.
  it('rejects a conversion event whose container belongs to a different organisation', async () => {
    await withRolledBackTransaction(async client => {
      const ownerA = await createUser(client, 'owner-a')
      const orgA = await createOrg(client, ownerA, 'Org A')
      const editorA = await createUser(client, 'editor-a')
      await addMember(client, orgA, editorA, 'editor')

      const ownerB = await createUser(client, 'owner-b')
      const orgB = await createOrg(client, ownerB, 'Org B')
      const containerB = await createContainer(client, orgB, 'Container B')

      await impersonate(client, editorA)

      await expect(
        client.query(
          `insert into public.conversion_events (display_id, container_id, organisation_id, event_name)
           values ($1, $2, $3, $4)`,
          ['CONID_TE_9101', containerB, orgA, 'cross_org_conversion']
        )
      ).rejects.toThrow(/row-level security/i)
    })
  })

  it('allows an editor to create a conversion event on their own organisation\'s container', async () => {
    await withRolledBackTransaction(async client => {
      const owner = await createUser(client, 'owner')
      const org = await createOrg(client, owner, 'Org')
      const editor = await createUser(client, 'editor')
      await addMember(client, org, editor, 'editor')
      const container = await createContainer(client, org, 'Container')

      await impersonate(client, editor)

      const result = await client.query(
        `insert into public.conversion_events (display_id, container_id, organisation_id, event_name)
         values ($1, $2, $3, $4) returning id`,
        ['CONID_TE_9102', container, org, 'same_org_conversion']
      )
      expect(result.rowCount).toBe(1)
    })
  })
})

describe('anonymous access to authenticated-only functions (ADR-0041)', () => {
  // Found in the same session: Supabase's default privileges grant EXECUTE
  // on every new public-schema function directly to `anon` and
  // `authenticated`, not just PUBLIC — so every prior `revoke ... from
  // public` in this schema never actually revoked anything from `anon`.
  // find_user_by_email had no internal auth check at all, making this a
  // real, live user-enumeration hole (fixed in 20260917030000). These four
  // functions should now all reject a caller with no session whatsoever —
  // not just an authenticated non-member.
  it('rejects an anonymous caller (no session at all) from find_user_by_email', async () => {
    await withRolledBackTransaction(async client => {
      await createUser(client, 'findable')
      await impersonateAnon(client)
      await expect(client.query(`select * from public.find_user_by_email('doesnotmatter@test.dev')`)).rejects.toThrow(
        /permission denied/i
      )
    })
  })

  it('rejects an anonymous caller from get_invite_code', async () => {
    await withRolledBackTransaction(async client => {
      const owner = await createUser(client, 'owner')
      const org = await createOrg(client, owner, 'Org')
      await impersonateAnon(client)
      await expect(client.query(`select public.get_invite_code($1)`, [org])).rejects.toThrow(/permission denied/i)
    })
  })

  it('rejects an anonymous caller from redeem_invite_code', async () => {
    await withRolledBackTransaction(async client => {
      await impersonateAnon(client)
      await expect(client.query(`select public.redeem_invite_code('AAAAAAAA')`)).rejects.toThrow(/permission denied/i)
    })
  })
})

describe('expired membership', () => {
  it('is treated as not an active member, blocking a write that would otherwise be allowed', async () => {
    await withRolledBackTransaction(async client => {
      const owner = await createUser(client, 'owner')
      const org = await createOrg(client, owner, 'Org')
      const expiredEditor = await createUser(client, 'expired-editor')
      // expires_at in the past — is_active_org_member()'s
      // `expires_at is null or expires_at > now()` check should exclude this row.
      await addMember(client, org, expiredEditor, 'editor', '2020-01-01T00:00:00Z')
      const container = await createContainer(client, org, 'Container')

      await impersonate(client, expiredEditor)

      await expect(
        client.query(
          `insert into public.tags (display_id, container_id, organisation_id, name, tag_type)
           values ($1, $2, $3, $4, $5)`,
          ['TAGID_TE_9006', container, org, 'Expired-membership tag', 'custom_html']
        )
      ).rejects.toThrow(/row-level security/i)
    })
  })
})
