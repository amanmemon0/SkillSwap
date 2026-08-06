-- Add email column to profiles table
alter table public.profiles add column if not exists email text;

-- Backfill email addresses from public.users to public.profiles
update public.profiles p
set email = u.email
from public.users u
where p.id = u.id and p.email is null;

-- Function to check username availability and suggest available suffixes if taken
create or replace function public.suggest_usernames(p_username text)
returns text[] as $$
declare
  suggestions text[] := '{}';
  suffix integer := 1;
  candidate text;
begin
  -- If the username is not taken, return an empty array
  if not exists (
    select 1 from public.profiles 
    where lower(username) = lower(p_username)
  ) then
    return suggestions;
  end if;

  -- Generate exactly 3 unique suggestions with numeric suffixes
  while array_length(suggestions, 1) is null or array_length(suggestions, 1) < 3 loop
    candidate := p_username || suffix::text;
    if not exists (
      select 1 from public.profiles 
      where lower(username) = lower(candidate)
    ) then
      suggestions := array_append(suggestions, candidate);
    end if;
    suffix := suffix + 1;
  end loop;

  return suggestions;
end;
$$ language plpgsql security definer;
