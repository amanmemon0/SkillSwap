create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  location text,
  role text default 'user',
  created_at timestamptz default now()
);

grant all on public.profiles to service_role, postgres;

