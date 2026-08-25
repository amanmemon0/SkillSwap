-- Migration: Add RLS policies for exchanges and notifications tables to enable frontend access and realtime updates

-- 1. Policies for public.exchanges
drop policy if exists "Users can view their own exchanges" on public.exchanges;
create policy "Users can view their own exchanges" on public.exchanges
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can create their own exchanges" on public.exchanges;
create policy "Users can create their own exchanges" on public.exchanges
  for insert to authenticated
  with check (auth.uid() = sender_id);

drop policy if exists "Users can update their own exchanges" on public.exchanges;
create policy "Users can update their own exchanges" on public.exchanges
  for update to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);


-- 2. Policies for public.notifications
drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications" on public.notifications
  for select to authenticated
  using (auth.uid() = profile_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications" on public.notifications
  for update to authenticated
  using (auth.uid() = profile_id);
