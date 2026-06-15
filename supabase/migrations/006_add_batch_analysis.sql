-- Structured column insights and priority highlights per batch
alter table public.batches
  add column if not exists analysis jsonb;
