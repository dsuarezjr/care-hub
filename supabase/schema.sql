create table if not exists public.care_hub_snapshots (
  family_id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text not null default 'unknown'
);

alter table public.care_hub_snapshots enable row level security;

drop policy if exists "Authenticated users can read snapshots"
on public.care_hub_snapshots;

create policy "Authenticated users can read snapshots"
on public.care_hub_snapshots
for select
using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can upsert snapshots"
on public.care_hub_snapshots;

create policy "Authenticated users can upsert snapshots"
on public.care_hub_snapshots
for insert
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update snapshots"
on public.care_hub_snapshots;

create policy "Authenticated users can update snapshots"
on public.care_hub_snapshots
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create table if not exists public.care_pulse (
  family_id text primary key,
  care_status text not null check (care_status in ('Stable', 'Alert')),
  one_big_thing text not null,
  updated_at timestamptz not null default now(),
  updated_by text not null default 'unknown'
);

create table if not exists public.care_entries (
  id text primary key,
  family_id text not null,
  entry_type text not null check (entry_type in ('clinicalLog', 'sideEffects', 'visitLog', 'therapy', 'activities', 'medications')),
  payload jsonb not null,
  created_at timestamptz not null,
  created_by text not null default 'unknown',
  updated_at timestamptz not null default now()
);

alter table public.care_entries drop constraint if exists care_entries_entry_type_check;
alter table public.care_entries
  add constraint care_entries_entry_type_check
  check (entry_type in ('clinicalLog', 'sideEffects', 'visitLog', 'therapy', 'activities', 'medications'));

create index if not exists care_entries_family_id_idx on public.care_entries (family_id);
create index if not exists care_entries_entry_type_idx on public.care_entries (entry_type);

create table if not exists public.family_profiles (
  family_id text not null,
  user_id uuid not null,
  email text not null,
  display_name text not null,
  role_label text not null default 'Family member',
  updated_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create table if not exists public.family_members (
  family_id text not null,
  user_id uuid not null,
  email text not null,
  role_label text not null default 'Family member',
  updated_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

alter table public.care_pulse enable row level security;
alter table public.care_entries enable row level security;
alter table public.family_profiles enable row level security;
alter table public.family_members enable row level security;

drop policy if exists "Members can read memberships" on public.family_members;
create policy "Members can read memberships"
on public.family_members
for select
using (user_id = auth.uid());

drop policy if exists "Users can insert own membership" on public.family_members;
create policy "Users can insert own membership"
on public.family_members
for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update own membership" on public.family_members;
create policy "Users can update own membership"
on public.family_members
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Authenticated users can read pulse" on public.care_pulse;
drop policy if exists "Family members can read pulse" on public.care_pulse;
create policy "Family members can read pulse"
on public.care_pulse
for select
using (
  exists (
    select 1
    from public.family_members m
    where m.family_id = care_pulse.family_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can upsert pulse" on public.care_pulse;
drop policy if exists "Family members can insert pulse" on public.care_pulse;
create policy "Family members can insert pulse"
on public.care_pulse
for insert
with check (
  exists (
    select 1
    from public.family_members m
    where m.family_id = care_pulse.family_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can update pulse" on public.care_pulse;
drop policy if exists "Family members can update pulse" on public.care_pulse;
create policy "Family members can update pulse"
on public.care_pulse
for update
using (
  exists (
    select 1
    from public.family_members m
    where m.family_id = care_pulse.family_id
      and m.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.family_members m
    where m.family_id = care_pulse.family_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can read entries" on public.care_entries;
drop policy if exists "Family members can read entries" on public.care_entries;
create policy "Family members can read entries"
on public.care_entries
for select
using (
  exists (
    select 1
    from public.family_members m
    where m.family_id = care_entries.family_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can insert entries" on public.care_entries;
drop policy if exists "Family members can insert entries" on public.care_entries;
create policy "Family members can insert entries"
on public.care_entries
for insert
with check (
  exists (
    select 1
    from public.family_members m
    where m.family_id = care_entries.family_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can update entries" on public.care_entries;
drop policy if exists "Family members can update entries" on public.care_entries;
create policy "Family members can update entries"
on public.care_entries
for update
using (
  exists (
    select 1
    from public.family_members m
    where m.family_id = care_entries.family_id
      and m.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.family_members m
    where m.family_id = care_entries.family_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can read profiles" on public.family_profiles;
drop policy if exists "Family members can read profiles" on public.family_profiles;
create policy "Family members can read profiles"
on public.family_profiles
for select
using (
  exists (
    select 1
    from public.family_members m
    where m.family_id = family_profiles.family_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can insert profiles" on public.family_profiles;
drop policy if exists "Family members can insert profiles" on public.family_profiles;
create policy "Family members can insert profiles"
on public.family_profiles
for insert
with check (
  exists (
    select 1
    from public.family_members m
    where m.family_id = family_profiles.family_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can update profiles" on public.family_profiles;
drop policy if exists "Family members can update profiles" on public.family_profiles;
create policy "Family members can update profiles"
on public.family_profiles
for update
using (
  exists (
    select 1
    from public.family_members m
    where m.family_id = family_profiles.family_id
      and m.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.family_members m
    where m.family_id = family_profiles.family_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can read snapshots" on public.care_hub_snapshots;
drop policy if exists "Family members can read snapshots" on public.care_hub_snapshots;
create policy "Family members can read snapshots"
on public.care_hub_snapshots
for select
using (
  exists (
    select 1
    from public.family_members m
    where m.family_id = care_hub_snapshots.family_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can upsert snapshots" on public.care_hub_snapshots;
drop policy if exists "Family members can insert snapshots" on public.care_hub_snapshots;
create policy "Family members can insert snapshots"
on public.care_hub_snapshots
for insert
with check (
  exists (
    select 1
    from public.family_members m
    where m.family_id = care_hub_snapshots.family_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can update snapshots" on public.care_hub_snapshots;
drop policy if exists "Family members can update snapshots" on public.care_hub_snapshots;
create policy "Family members can update snapshots"
on public.care_hub_snapshots
for update
using (
  exists (
    select 1
    from public.family_members m
    where m.family_id = care_hub_snapshots.family_id
      and m.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.family_members m
    where m.family_id = care_hub_snapshots.family_id
      and m.user_id = auth.uid()
  )
);
