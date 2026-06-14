create policy "Users delete own batches" on public.batches
  for delete using (auth.uid() = user_id);
