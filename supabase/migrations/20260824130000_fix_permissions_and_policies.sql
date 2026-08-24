-- Migration: Fix permissions and policies for API roles (anon and authenticated)
-- 1. Grant schema usage and table privileges
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- 2. Create RLS policy to allow authenticated users to read profiles for matching/explore
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users" on public.profiles
  for select to authenticated using (true);
