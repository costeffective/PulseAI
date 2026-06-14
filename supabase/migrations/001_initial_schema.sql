-- batches: one upload session per user
create table public.batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  summary text,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

-- feedback_items: classified rows
create table public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  line_index int not null,
  text text not null,
  category text not null,
  sentiment text not null check (sentiment in ('positive', 'negative', 'neutral')),
  priority text not null check (priority in ('high', 'medium', 'low')),
  created_at timestamptz not null default now()
);

create index feedback_items_batch_id_idx on public.feedback_items(batch_id);

alter table public.batches enable row level security;
alter table public.feedback_items enable row level security;

create policy "Users read own batches" on public.batches for select using (auth.uid() = user_id);
create policy "Users insert own batches" on public.batches for insert with check (auth.uid() = user_id);
create policy "Users update own batches" on public.batches for update using (auth.uid() = user_id);

create policy "Users read own items" on public.feedback_items for select
  using (exists (select 1 from public.batches b where b.id = batch_id and b.user_id = auth.uid()));
create policy "Users insert own items" on public.feedback_items for insert
  with check (exists (select 1 from public.batches b where b.id = batch_id and b.user_id = auth.uid()));
