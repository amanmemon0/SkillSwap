-- Add metrics columns to public.profiles table
alter table public.profiles
  add column if not exists rating numeric(3,2) default 5.0 check (rating >= 0.0 and rating <= 5.0),
  add column if not exists total_reviews integer default 0 check (total_reviews >= 0),
  add column if not exists completed_swaps integer default 0 check (completed_swaps >= 0),
  add column if not exists pending_swaps integer default 0 check (pending_swaps >= 0),
  add column if not exists cancelled_swaps integer default 0 check (cancelled_swaps >= 0),
  add column if not exists reports_count integer default 0 check (reports_count >= 0);

-- Trigger function to automatically maintain exchange count statistics in profiles
create or replace function public.update_profile_exchange_stats()
returns trigger as $$
begin
  -- For sender and receiver profiles of the NEW row
  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') then
    update public.profiles
    set
      completed_swaps = (
        select count(*) from public.exchanges
        where (sender_id = id or receiver_id = id) and status = 'completed'
      ),
      pending_swaps = (
        select count(*) from public.exchanges
        where (sender_id = id or receiver_id = id) and status = 'pending'
      ),
      cancelled_swaps = (
        select count(*) from public.exchanges
        where (sender_id = id or receiver_id = id) and status in ('sender_cancelled', 'receiver_declined')
      )
    where id in (NEW.sender_id, NEW.receiver_id);
  end if;

  -- For sender and receiver profiles of the OLD row (in case of update or deletion)
  if (TG_OP = 'DELETE' or TG_OP = 'UPDATE') then
    update public.profiles
    set
      completed_swaps = (
        select count(*) from public.exchanges
        where (sender_id = id or receiver_id = id) and status = 'completed'
      ),
      pending_swaps = (
        select count(*) from public.exchanges
        where (sender_id = id or receiver_id = id) and status = 'pending'
      ),
      cancelled_swaps = (
        select count(*) from public.exchanges
        where (sender_id = id or receiver_id = id) and status in ('sender_cancelled', 'receiver_declined')
      )
    where id in (OLD.sender_id, OLD.receiver_id);
  end if;

  return null;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists
drop trigger if exists on_exchange_stats_change on public.exchanges;

-- Create trigger
create trigger on_exchange_stats_change
  after insert or update or delete on public.exchanges
  for each row
  execute function public.update_profile_exchange_stats();

-- Seed additional skills required for the members
insert into public.skills (name, category, approved) values
  ('Japanese', 'languages', true),
  ('Guitar', 'life_skills', true),
  ('Product Design', 'design', true),
  ('Figma Fundamentals', 'design', true),
  ('Community Building', 'communication', true),
  ('Pottery', 'life_skills', true)
on conflict (name) do nothing;

-- Seed users in public.users table (with password 'password123')
insert into public.users (id, email, password_hash, role) values
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'john@example.com', '$2a$10$vI8aWBnW3fID.1Sp67gD9uz.y6z7T.7z6T7E3T/oHh5C3rU9gGgD2', 'user'),
  ('f67a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', 'admin@skillswap.city', '$2a$10$vI8aWBnW3fID.1Sp67gD9uz.y6z7T.7z6T7E3T/oHh5C3rU9gGgD2', 'admin'),
  ('11111111-1111-1111-1111-111111111111', 'meera@skillswap.city', '$2a$10$vI8aWBnW3fID.1Sp67gD9uz.y6z7T.7z6T7E3T/oHh5C3rU9gGgD2', 'user'),
  ('22222222-2222-2222-2222-222222222222', 'rohan@skillswap.city', '$2a$10$vI8aWBnW3fID.1Sp67gD9uz.y6z7T.7z6T7E3T/oHh5C3rU9gGgD2', 'user'),
  ('33333333-3333-3333-3333-333333333333', 'tara@skillswap.city', '$2a$10$vI8aWBnW3fID.1Sp67gD9uz.y6z7T.7z6T7E3T/oHh5C3rU9gGgD2', 'user'),
  ('b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'aisha@skillswap.city', '$2a$10$vI8aWBnW3fID.1Sp67gD9uz.y6z7T.7z6T7E3T/oHh5C3rU9gGgD2', 'user'),
  ('c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'noah@example.com', '$2a$10$vI8aWBnW3fID.1Sp67gD9uz.y6z7T.7z6T7E3T/oHh5C3rU9gGgD2', 'user'),
  ('d4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'sofia@example.com', '$2a$10$vI8aWBnW3fID.1Sp67gD9uz.y6z7T.7z6T7E3T/oHh5C3rU9gGgD2', 'user'),
  ('e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', 'arjun@skillswap.city', '$2a$10$vI8aWBnW3fID.1Sp67gD9uz.y6z7T.7z6T7E3T/oHh5C3rU9gGgD2', 'user'),
  ('7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d', 'marcus@example.com', '$2a$10$vI8aWBnW3fID.1Sp67gD9uz.y6z7T.7z6T7E3T/oHh5C3rU9gGgD2', 'user')
on conflict (id) do update set
  email = excluded.email,
  role = excluded.role;

-- Seed profiles in public.profiles table
insert into public.profiles (
  id, full_name, username, phone, country, state, city, location, bio,
  primary_skill, skill_level, learning_skills, availability, learning_mode,
  role, status, rating, total_reviews, completed_swaps, pending_swaps, cancelled_swaps, reports_count
) values
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'John Doe', 'johndoe', '+91 9876543210', 'India', 'Gujarat', 'Ahmedabad', 'Ahmedabad, Gujarat, India', 'Passionate web developer and mentor.', 'React Basics', 'Advanced', array['UI/UX Fundamentals', 'Public Speaking'], array['Weekends'], 'Online', 'user', 'Active', 4.8, 42, 18, 2, 1, 0),
  ('f67a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', 'Olivia Bennett', 'olivia.admin', '+91 99900 11552', 'India', 'Maharashtra', 'Mumbai', 'Mumbai, Maharashtra, India', 'Keeping the SkillSwap community welcoming and useful.', 'Community Building', 'Expert', array['Pottery'], array['Weekdays'], 'Both', 'admin', 'Active', 5.0, 48, 28, 0, 0, 0),
  ('11111111-1111-1111-1111-111111111111', 'Meera Iyer', 'meera.iyer', '+91 98240 12345', 'India', 'Gujarat', 'Ahmedabad', 'Ahmedabad, Gujarat, India', 'Spanish tutor and language enthusiast.', 'Spanish Conversation', 'Expert', array['React Basics'], array['Evenings', 'Weekends'], 'Both', 'user', 'Active', 4.9, 35, 12, 1, 0, 0),
  ('22222222-2222-2222-2222-222222222222', 'Rohan Kapoor', 'rohan.kapoor', '+91 98110 54321', 'India', 'Gujarat', 'Ahmedabad', 'Ahmedabad, Gujarat, India', 'Creative street photographer exploring visual storytelling.', 'Street Photography', 'Advanced', array['UI/UX Fundamentals'], array['Weekends'], 'Offline', 'user', 'Active', 4.6, 22, 5, 2, 1, 0),
  ('33333333-3333-3333-3333-333333333333', 'Tara Singh', 'tara.singh', '+91 99000 98765', 'India', 'Gujarat', 'Ahmedabad', 'Ahmedabad, Gujarat, India', 'Business advisor helping freelancers organize operations.', 'Excel for Small Business', 'Intermediate', array['Introduction to Python'], array['Weekdays'], 'Online', 'user', 'Active', 4.7, 15, 8, 0, 0, 0),
  ('b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'Aisha Patel', 'aisha.designs', '+91 98250 11342', 'India', 'Gujarat', 'Ahmedabad', 'Ahmedabad, Gujarat, India', 'Product designer who loves making digital products friendlier.', 'Product Design', 'Expert', array['Spanish Conversation', 'Street Photography'], array['Evenings', 'Weekends'], 'Both', 'user', 'Active', 4.9, 31, 22, 1, 0, 0),
  ('c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'Noah Williams', 'noahteaches', '+91 99872 54111', 'India', 'Maharashtra', 'Mumbai', 'Mumbai, Maharashtra, India', 'Language lover and patient teacher.', 'Japanese', 'Advanced', array['React Basics', 'Cooking Essentials'], array['Weekdays'], 'Offline', 'user', 'Pending', 4.5, 12, 8, 3, 1, 0),
  ('d4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'Sofia Chen', 'sofiaframes', '+91 98111 82645', 'India', 'Delhi', 'Delhi', 'Delhi, Delhi, India', 'Portrait photographer, visual storyteller, lifelong learner.', 'Street Photography', 'Advanced', array['Public Speaking'], array['Weekends'], 'Both', 'user', 'Suspended', 4.3, 18, 9, 0, 2, 2),
  ('e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', 'Arjun Rao', 'arjun.codes', '+91 97022 74311', 'India', 'Maharashtra', 'Pune', 'Pune, Maharashtra, India', 'Engineering student sharing practical programming skills.', 'Introduction to Python', 'Intermediate', array['Guitar', 'UI/UX Fundamentals'], array['Evenings'], 'Online', 'user', 'Active', 4.7, 25, 15, 1, 0, 0),
  ('7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d', 'Marcus Lee', 'marcusl', '+91 98335 20010', 'India', 'Karnataka', 'Bengaluru', 'Bengaluru, Karnataka, India', 'Frontend developer and open source contributor.', 'React Basics', 'Advanced', array['UI/UX Fundamentals'], array['Mornings'], 'Online', 'user', 'Banned', 3.4, 5, 2, 0, 4, 4)
on conflict (id) do update set
  full_name = excluded.full_name,
  username = excluded.username,
  phone = excluded.phone,
  country = excluded.country,
  state = excluded.state,
  city = excluded.city,
  location = excluded.location,
  bio = excluded.bio,
  primary_skill = excluded.primary_skill,
  skill_level = excluded.skill_level,
  learning_skills = excluded.learning_skills,
  availability = excluded.availability,
  learning_mode = excluded.learning_mode,
  role = excluded.role,
  status = excluded.status,
  rating = excluded.rating,
  total_reviews = excluded.total_reviews,
  completed_swaps = excluded.completed_swaps,
  pending_swaps = excluded.pending_swaps,
  cancelled_swaps = excluded.cancelled_swaps,
  reports_count = excluded.reports_count;

-- Seed member skills offers and learns in public.member_skills
delete from public.member_skills where profile_id in (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'f67a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e',
  'c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f',
  'd4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a',
  'e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
  '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d'
);

insert into public.member_skills (profile_id, skill_id, type)
select 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'::uuid, id, 'offer' from public.skills where name = 'React Basics' union all
select 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'::uuid, id, 'learn' from public.skills where name in ('UI/UX Fundamentals', 'Public Speaking') union all
select 'f67a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c'::uuid, id, 'offer' from public.skills where name = 'Community Building' union all
select 'f67a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c'::uuid, id, 'learn' from public.skills where name = 'Pottery' union all
select '11111111-1111-1111-1111-111111111111'::uuid, id, 'offer' from public.skills where name = 'Spanish Conversation' union all
select '11111111-1111-1111-1111-111111111111'::uuid, id, 'learn' from public.skills where name = 'React Basics' union all
select '22222222-2222-2222-2222-222222222222'::uuid, id, 'offer' from public.skills where name = 'Street Photography' union all
select '22222222-2222-2222-2222-222222222222'::uuid, id, 'learn' from public.skills where name = 'UI/UX Fundamentals' union all
select '33333333-3333-3333-3333-333333333333'::uuid, id, 'offer' from public.skills where name = 'Excel for Small Business' union all
select '33333333-3333-3333-3333-333333333333'::uuid, id, 'learn' from public.skills where name = 'Introduction to Python' union all
select 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'::uuid, id, 'offer' from public.skills where name = 'Product Design' union all
select 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'::uuid, id, 'learn' from public.skills where name in ('Spanish Conversation', 'Street Photography') union all
select 'c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid, id, 'offer' from public.skills where name = 'Japanese' union all
select 'c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid, id, 'learn' from public.skills where name = 'React Basics' union all
select 'd4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a'::uuid, id, 'offer' from public.skills where name = 'Street Photography' union all
select 'd4e5f67a-8b9c-0d1e-2f3a-4b5c-6d7e8f9a'::uuid, id, 'learn' from public.skills where name = 'Public Speaking' union all
select 'e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b'::uuid, id, 'offer' from public.skills where name = 'Introduction to Python' union all
select 'e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b'::uuid, id, 'learn' from public.skills where name in ('Guitar', 'UI/UX Fundamentals') union all
select '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d'::uuid, id, 'offer' from public.skills where name = 'React Basics' union all
select '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d'::uuid, id, 'learn' from public.skills where name = 'UI/UX Fundamentals';

-- Seed exchanges in public.exchanges
insert into public.exchanges (id, sender_id, receiver_id, sender_skill_id, receiver_skill_id, sender_skill_name, receiver_skill_name, status, message) values
  ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', '11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', (select id from public.skills where name = 'Spanish Conversation'), (select id from public.skills where name = 'React Basics'), 'Spanish Conversation', 'React Basics', 'matched', 'Let''s start this Thursday evening!'),
  ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', '22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', (select id from public.skills where name = 'Street Photography'), (select id from public.skills where name = 'UI/UX Fundamentals'), 'Street Photography', 'UI/UX Fundamentals', 'pending', 'Are weekends better for you?'),
  ('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '33333333-3333-3333-3333-333333333333', (select id from public.skills where name = 'React Basics'), (select id from public.skills where name = 'Excel for Small Business'), 'React Basics', 'Excel for Small Business', 'completed', 'Thanks for the Python class today!'),
  ('e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', (select id from public.skills where name = 'React Basics'), (select id from public.skills where name = 'Street Photography'), 'React Basics', 'Street Photography', 'sender_cancelled', 'Cancelled exchange request.')
on conflict (id) do update set
  status = excluded.status,
  message = excluded.message;

-- Seed conversations
insert into public.conversations (id, user1_id, user2_id) values
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', '22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '33333333-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')
on conflict (id) do nothing;

-- Seed messages
insert into public.messages (id, conversation_id, sender_id, body, created_at) values
  ('11111111-1111-1111-1111-111111111112', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '11111111-1111-1111-1111-111111111111', 'Hi! I saw you wanted to learn Spanish. I can help with that!', now() - interval '20 minutes'),
  ('11111111-1111-1111-1111-111111111113', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Awesome! I can teach you React in exchange.', now() - interval '15 minutes'),
  ('11111111-1111-1111-1111-111111111114', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '11111111-1111-1111-1111-111111111111', 'That sounds perfect! Let''s start this Thursday evening!', now() - interval '12 minutes'),
  
  ('22222222-2222-2222-2222-222222222223', 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', '22222222-2222-2222-2222-222222222222', 'Hey Rohan here, interested in your UI/UX skill.', now() - interval '2 hours'),
  ('22222222-2222-2222-2222-222222222224', 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Hey Rohan! I''d love to learn street photography from you.', now() - interval '1.9 hours'),
  ('22222222-2222-2222-2222-222222222225', 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', '22222222-2222-2222-2222-222222222222', 'Are weekends better for you?', now() - interval '1.8 hours'),
  
  ('33333333-3333-3333-3333-333333333334', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Let me know if you need help with Excel.', now() - interval '1 day'),
  ('33333333-3333-3333-3333-333333333335', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '33333333-3333-3333-3333-333333333333', 'Thanks for the Python class today!', now() - interval '18 hours')
on conflict (id) do nothing;
