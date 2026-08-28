import { randomUUID } from 'node:crypto'
import { Pool, type PoolClient } from 'pg'

// Local Supabase's default superuser connection (from `supabase start`'s
// printed output) — bypasses RLS entirely, which is exactly what fixture
// setup needs. RLS itself is exercised by impersonate() switching to the
// `authenticated` role inside the same transaction, mirroring exactly what
// PostgREST does per-request in production: SET ROLE from the JWT's `role`
// claim, plus `request.jwt.claims` for auth.uid() to read.
export const DB_URL = process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

export const pool = new Pool({ connectionString: DB_URL })

function randomSuffix(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

// Every fixture helper below runs as the connection's current role (the
// postgres superuser, before impersonate() is called) — RLS doesn't apply
// to fixture setup, only to the queries under test.

export async function createUser(client: PoolClient, namePrefix: string): Promise<string> {
  const id = randomUUID()
  await client.query(
    `insert into public.users (id, display_id, email, display_name) values ($1, $2, $3, $4)`,
    [id, `USRID_TE_${randomSuffix()}`, `${namePrefix}-${randomSuffix()}@test.dev`, namePrefix]
  )
  return id
}

// Inserting an organisation auto-creates an 'owner' organisation_members row
// for ownerId via the auto_owner_membership() trigger — see
// 20260601000000_init_schema.sql.
export async function createOrg(client: PoolClient, ownerId: string, namePrefix: string): Promise<string> {
  const id = randomUUID()
  const suffix = randomSuffix()
  // slug must match ^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$ — no spaces.
  const slugBase = namePrefix.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  await client.query(
    `insert into public.organisations (id, display_id, name, slug, owner_id) values ($1, $2, $3, $4, $5)`,
    [id, `ORGID_TE_${suffix}`, namePrefix, `${slugBase}-${suffix}`, ownerId]
  )
  return id
}

export async function addMember(
  client: PoolClient,
  organisationId: string,
  userId: string,
  role: 'owner' | 'admin' | 'editor' | 'viewer',
  expiresAt: string | null = null
): Promise<void> {
  // check (expires_at is null or expires_at > joined_at), and joined_at
  // defaults to now() — an already-expired row needs joined_at pushed back
  // too, or the insert itself violates the constraint before RLS is even
  // reached.
  const joinedAt = expiresAt ? new Date(new Date(expiresAt).getTime() - 24 * 60 * 60 * 1000).toISOString() : null
  await client.query(
    `insert into public.organisation_members (display_id, organisation_id, user_id, role, joined_at, expires_at)
     values ($1, $2, $3, $4, coalesce($5, now()), $6)`,
    [`MEMID_TE_${randomSuffix()}`, organisationId, userId, role, joinedAt, expiresAt]
  )
}

export async function createContainer(client: PoolClient, organisationId: string, namePrefix: string): Promise<string> {
  const id = randomUUID()
  await client.query(
    `insert into public.containers (id, display_id, organisation_id, name) values ($1, $2, $3, $4)`,
    [id, `CNTID_TE_${randomSuffix()}`, organisationId, namePrefix]
  )
  return id
}

// Switches the rest of this transaction to behave exactly as PostgREST
// would for a request authenticated as userId: auth.uid() resolves via
// request.jwt.claims, and RLS is enforced because the role is no longer
// the superuser. Must run fixture creation BEFORE calling this — once
// switched, only what that user's own policies allow succeeds.
export async function impersonate(client: PoolClient, userId: string): Promise<void> {
  await client.query(`select set_config('request.jwt.claims', $1, true)`, [
    JSON.stringify({ sub: userId, role: 'authenticated' }),
  ])
  await client.query('set local role authenticated')
}

// Every test should wrap its fixtures + impersonation + assertions in one
// transaction and always roll back, so nothing persists and tests never
// interfere with each other regardless of run order.
export async function withRolledBackTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('begin')
    try {
      return await fn(client)
    } finally {
      await client.query('rollback')
    }
  } finally {
    client.release()
  }
}
