-- Link each integration connection to its persistent batch
alter table public.integration_connections
  add column if not exists batch_id uuid references public.batches(id) on delete set null;

create index if not exists integration_connections_batch_id_idx
  on public.integration_connections (batch_id);
