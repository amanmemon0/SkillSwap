drop table if exists public.skills cascade;

-- Skills table
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('development', 'languages', 'design', 'photography', 'business', 'communication', 'life_skills', 'other')),
  approved boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Member Skills junction table
create table if not exists public.member_skills (
  profile_id uuid references public.profiles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  type text not null check (type in ('offer', 'learn')),
  created_at timestamptz not null default now(),
  primary key (profile_id, skill_id, type)
);

-- Separate index on skill_id for performance
create index if not exists member_skills_skill_id_idx on public.member_skills(skill_id);

-- Partial index on approved skills
create index if not exists skills_approved_idx on public.skills(approved) where approved = true;

-- Enable RLS (backend-mediated, deny-by-default)
alter table public.skills enable row level security;
alter table public.member_skills enable row level security;

-- Seed realistic skills
insert into public.skills (name, category, approved) values
  ('React Basics', 'development', true),
  ('Spanish Conversation', 'languages', true),
  ('UI/UX Fundamentals', 'design', true),
  ('Street Photography', 'photography', true),
  ('Introduction to Python', 'development', true),
  ('Excel for Small Business', 'business', true),
  ('Tailwind CSS Tips', 'development', true),
  ('Lightroom Editing', 'photography', true),
  ('Public Speaking', 'communication', true),
  ('Cooking Essentials', 'life_skills', true)
on conflict (name) do nothing;
