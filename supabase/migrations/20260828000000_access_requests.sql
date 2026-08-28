-- supabase/migrations/20260828000000_access_requests.sql
--
-- Closes a real gap: editor and viewer are supposed to be different roles
-- (every write policy on tags/triggers/variables/conversion_events/containers
-- already excludes 'viewer'), but the app never gave a viewer any path
-- forward other than a raw, confusing RLS rejection when they tried to write
-- something. This adds a lightweight request/approve flow: a viewer can ask
-- to be upgraded to 'editor', and an owner/admin can approve (which actually
-- changes their role) or dismiss it.

create table if not exists public.access_requests (
  id              uuid        primary key default gen_random_uuid(),
  display_id      text        not null unique
                              check (display_id ~ '^REQID_[A-Z]{2}_[0-9]{4}$'),
  organisation_id uuid        not null references public.organisations(id) on delete cascade,
  user_id         uuid        not null references public.users(id)          on delete cascade,
  requested_role  text        not null default 'editor'
                              check (requested_role = 'editor'),
  message         text        check (message is null or char_length(message) <= 280),
  status          text        not null default 'pending'
                              check (status in ('pending', 'approved', 'dismissed')),
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  resolved_by     uuid        references public.users(id)
);

-- One outstanding request per person per org — no need to let someone spam
-- the queue by resubmitting before the first is resolved.
create unique index if not exists access_requests_one_pending_per_user
  on public.access_requests (organisation_id, user_id)
  where (status = 'pending');

create index if not exists access_requests_org_pending_idx
  on public.access_requests (organisation_id)
  where (status = 'pending');

alter table public.access_requests enable row level security;

drop policy if exists "requesters can select own requests" on public.access_requests;
create policy "requesters can select own requests"
  on public.access_requests for select
  using (user_id = auth.uid());

drop policy if exists "admins can select org requests" on public.access_requests;
create policy "admins can select org requests"
  on public.access_requests for select
  using (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = access_requests.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin')
    )
  );

-- Only an active *viewer* can open a request — an editor/admin/owner already
-- has the access this flow exists to grant.
drop policy if exists "viewers can request access" on public.access_requests;
create policy "viewers can request access"
  on public.access_requests for insert
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.organisation_members
      where  organisation_id = access_requests.organisation_id
        and  user_id         = auth.uid()
        and  role            = 'viewer'
        and  (expires_at is null or expires_at > now())
    )
  );

drop policy if exists "admins can resolve requests" on public.access_requests;
create policy "admins can resolve requests"
  on public.access_requests for update
  using (
    exists (
      select 1 from public.organisation_members
      where  organisation_id = access_requests.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin')
    )
  )
  with check (
    status in ('approved', 'dismissed')
    and exists (
      select 1 from public.organisation_members
      where  organisation_id = access_requests.organisation_id
        and  user_id         = auth.uid()
        and  role            in ('owner', 'admin')
    )
  );
