-- Explicitly drop any permissive policies on profiles and users to pass security verification
drop policy if exists "Enable read access for all users" on public.profiles;
drop policy if exists "Enable select for all users" on public.profiles;
drop policy if exists "allow select" on public.profiles;
drop policy if exists "select_policy" on public.profiles;
drop policy if exists "profiles_select_policy" on public.profiles;
drop policy if exists "Allow public read access" on public.profiles;
drop policy if exists "Allow public select" on public.profiles;

drop policy if exists "Enable read access for all users" on public.users;
drop policy if exists "Enable select for all users" on public.users;
drop policy if exists "allow select" on public.users;

-- Ensure RLS is active
alter table public.profiles enable row level security;
alter table public.users enable row level security;
