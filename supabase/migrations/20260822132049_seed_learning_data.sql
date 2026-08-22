-- SQL Seed Migration: 20260822132049_seed_learning_data.sql
-- Description: Seed database with default courses, lectures, exams, and student enrollments.

-- 1. Insert Courses
insert into public.courses (id, teacher_id, skill_id, skill_name, title, description, category, status) values
  (
    '11111111-1111-1111-1111-11111111c111',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', -- John Doe
    (select id from public.skills where name = 'React Basics' limit 1),
    'React Basics',
    'React Development',
    'Master React from fundamentals to advanced patterns — hooks, state management, component architecture, and production best practices.',
    'development',
    'published'
  ),
  (
    '22222222-2222-2222-2222-22222222c222',
    '11111111-1111-1111-1111-111111111111', -- Meera Iyer
    (select id from public.skills where name = 'Street Photography' limit 1),
    'Street Photography',
    'Photography Basics',
    'Learn composition, lighting, portrait techniques, and post-processing fundamentals to capture stunning photographs.',
    'photography',
    'published'
  ),
  (
    '33333333-3333-3333-3333-33333333c333',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', -- John Doe
    (select id from public.skills where name = 'React Basics' limit 1), -- fallback
    'React Basics',
    'JavaScript Fundamentals',
    'Deep dive into JavaScript — closures, prototypes, async/await, ES modules, and modern patterns.',
    'development',
    'published'
  ),
  (
    '44444444-4444-4444-4444-44444444c444',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', -- John Doe
    (select id from public.skills where name = 'Product Design' limit 1),
    'Product Design',
    'Web Design Principles',
    'Color theory, typography, layout systems, responsive design, and UX fundamentals.',
    'design',
    'published'
  ),
  (
    '55555555-5555-5555-5555-55555555c555',
    'e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', -- Arjun Rao
    (select id from public.skills where name = 'Public Speaking' limit 1),
    'Public Speaking',
    'Public Speaking',
    'Overcome stage fright, structure compelling talks, and master audience engagement.',
    'communication',
    'published'
  )
on conflict (id) do nothing;


-- 2. Insert Lectures
insert into public.lectures (id, course_id, title, description, "order", duration_minutes, status) values
  ('11111111-1111-1111-1111-11111111d101', '11111111-1111-1111-1111-11111111c111', 'Introduction to React & JSX', 'Lecture 1 details', 1, 45, 'completed'),
  ('11111111-1111-1111-1111-11111111d102', '11111111-1111-1111-1111-11111111c111', 'Components & Props', 'Lecture 2 details', 2, 50, 'completed'),
  ('11111111-1111-1111-1111-11111111d103', '11111111-1111-1111-1111-11111111c111', 'State & Lifecycle', 'Lecture 3 details', 3, 40, 'completed'),
  ('11111111-1111-1111-1111-11111111d104', '11111111-1111-1111-1111-11111111c111', 'Handling Events', 'Lecture 4 details', 4, 45, 'upcoming'),
  
  ('22222222-2222-2222-2222-22222222d201', '22222222-2222-2222-2222-22222222c222', 'Camera Basics & Settings', 'Lecture 1 details', 1, 60, 'completed'),
  ('22222222-2222-2222-2222-22222222d202', '22222222-2222-2222-2222-22222222c222', 'Understanding Exposure Triangle', 'Lecture 2 details', 2, 55, 'completed'),
  ('22222222-2222-2222-2222-22222222d203', '22222222-2222-2222-2222-22222222c222', 'Composition Rules', 'Lecture 3 details', 3, 50, 'completed'),
  ('22222222-2222-2222-2222-22222222d204', '22222222-2222-2222-2222-22222222c222', 'Natural Light Photography', 'Lecture 4 details', 4, 45, 'upcoming'),

  ('55555555-5555-5555-5555-55555555d501', '55555555-5555-5555-5555-55555555c555', 'Overcoming Stage Fright', 'Lecture 1 details', 1, 40, 'completed'),
  ('55555555-5555-5555-5555-55555555d502', '55555555-5555-5555-5555-55555555c555', 'Structuring Your Talk', 'Lecture 2 details', 2, 45, 'completed')
on conflict (id) do nothing;


-- 3. Insert Exams & Questions
insert into public.exams (id, course_id, title, description, time_limit_mins, pass_mark_percentage, status) values
  (
    '11111111-1111-1111-1111-11111111e100',
    '11111111-1111-1111-1111-11111111c111',
    'React Development — Final Assessment',
    'This exam covers the primary React fundamentals. You have 30 minutes to complete 3 questions.',
    30,
    60.0,
    'active'
  ),
  (
    '55555555-5555-5555-5555-55555555e500',
    '55555555-5555-5555-5555-55555555c555',
    'Public Speaking — Final Assessment',
    'Assessment on stage presence and talk structuring.',
    20,
    60.0,
    'active'
  )
on conflict (id) do nothing;

insert into public.exam_questions (id, exam_id, question_text, options, correct_option_idx, "order") values
  (
    '11111111-1111-1111-1111-11111111f101',
    '11111111-1111-1111-1111-11111111e100',
    'What is JSX in React?',
    '["A JavaScript XML syntax extension", "A CSS framework", "A database query language", "A testing library"]'::jsonb,
    0,
    1
  ),
  (
    '11111111-1111-1111-1111-11111111f102',
    '11111111-1111-1111-1111-11111111e100',
    'Which hook is used for side effects in React?',
    '["useState", "useEffect", "useContext", "useRef"]'::jsonb,
    1,
    2
  ),
  (
    '11111111-1111-1111-1111-11111111f103',
    '11111111-1111-1111-1111-11111111e100',
    'What is the virtual DOM?',
    '["A real DOM copy", "A lightweight JS representation of the DOM", "A CSS rendering engine", "A browser API"]'::jsonb,
    1,
    3
  ),
  (
    '55555555-5555-5555-5555-55555555f501',
    '55555555-5555-5555-5555-55555555e500',
    'What is the recommended structure for a talk?',
    '["Random order", "Opening, body, conclusion", "Only body", "Only conclusion"]'::jsonb,
    1,
    1
  )
on conflict (id) do nothing;


-- 4. Seed Course Enrollments for John Doe (User a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d)
insert into public.course_enrollments (id, course_id, learner_id, status, progress, exam_state, certificate_state) values
  (
    '11111111-1111-1111-1111-11111111a100',
    '22222222-2222-2222-2222-22222222c222', -- Photography Basics
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', -- John Doe
    'active',
    75.0,
    'locked',
    'none'
  ),
  (
    '55555555-5555-5555-5555-55555555a500',
    '55555555-5555-5555-5555-55555555c555', -- Public Speaking
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', -- John Doe
    'completed',
    100.0,
    'passed',
    'requested'
  )
on conflict (id) do nothing;


-- 5. Seed Certificate Request for John Doe in Public Speaking
insert into public.certificate_requests (id, course_id, learner_id, score_snapshot, tutor_decision, admin_decision) values
  (
    '55555555-5555-5555-5555-55555555c999',
    '55555555-5555-5555-5555-55555555c555', -- Public Speaking
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', -- John Doe
    100.0,
    'pending',
    'pending'
  )
on conflict (id) do nothing;


-- Grant permissions
grant all privileges on all tables in schema public to service_role, postgres;
grant all privileges on all sequences in schema public to service_role, postgres;
grant all privileges on all functions in schema public to service_role, postgres;
