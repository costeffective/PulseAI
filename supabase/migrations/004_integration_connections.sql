-- Google Sheets / Google Forms sync connections
create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google_sheets'
    check (provider in ('google_sheets')),
  name text not null,
  status text not null default 'active'
    check (status in ('active', 'paused', 'error')),
  spreadsheet_id text not null,
  sheet_name text not null default 'Form Responses 1',
  credentials jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  last_synced_row int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index integration_connections_user_sheet_idx
  on public.integration_connections (user_id, spreadsheet_id);

create index integration_connections_status_idx
  on public.integration_connections (status)
  where status = 'active';

alter table public.integration_connections enable row level security;

create policy "Users read own integrations" on public.integration_connections
  for select using (auth.uid() = user_id);

create policy "Users insert own integrations" on public.integration_connections
  for insert with check (auth.uid() = user_id);

create policy "Users update own integrations" on public.integration_connections
  for update using (auth.uid() = user_id);

create policy "Users delete own integrations" on public.integration_connections
  for delete using (auth.uid() = user_id);
