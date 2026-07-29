alter table public.profiles
  add column if not exists username text,
  add column if not exists phone text,
  add column if not exists country text,
  add column if not exists state text,
  add column if not exists city text,
  add column if not exists bio text,
  add column if not exists primary_skill text,
  add column if not exists skill_level text,
  add column if not exists learning_skills text[] not null default '{}',
  add column if not exists availability text[] not null default '{}',
  add column if not exists learning_mode text;

create unique index if not exists profiles_username_unique
  on public.profiles (lower(username))
  where username is not null;
