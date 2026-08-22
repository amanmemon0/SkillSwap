-- SQL migration: 20260822124235_learning_and_skills.sql
-- Description: Create tables, triggers, indexes, and Row-Level Security (RLS) policies for learning management, exams, certificates, and skill requests.

-- 1. skill_requests table
create table if not exists public.skill_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  skill_name text not null,
  category text check (category in ('development', 'languages', 'design', 'photography', 'business', 'communication', 'life_skills', 'other')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Trigger for skill_requests updated_at
drop trigger if exists set_skill_requests_updated_at on public.skill_requests;
create trigger set_skill_requests_updated_at
  before update on public.skill_requests
  for each row
  execute function public.set_updated_at();

-- Indexes for skill_requests
create index if not exists skill_requests_requester_id_idx on public.skill_requests(requester_id);
create index if not exists skill_requests_status_idx on public.skill_requests(status);


-- 2. courses table
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  skill_name text not null,
  title text not null,
  description text,
  category text check (category in ('development', 'languages', 'design', 'photography', 'business', 'communication', 'life_skills', 'other')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for courses updated_at
drop trigger if exists set_courses_updated_at on public.courses;
create trigger set_courses_updated_at
  before update on public.courses
  for each row
  execute function public.set_updated_at();

-- Indexes for courses
create index if not exists courses_teacher_id_idx on public.courses(teacher_id);
create index if not exists courses_status_idx on public.courses(status);


-- 3. course_enrollments table
create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'dropped')),
  progress numeric not null default 0.0 check (progress >= 0.0 and progress <= 100.0),
  exam_state text not null default 'locked' check (exam_state in ('locked', 'eligible', 'requested', 'scheduled', 'passed', 'failed')),
  certificate_state text not null default 'none' check (certificate_state in ('none', 'requested', 'approved', 'rejected', 'issued')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint course_enrollments_course_learner_unique unique (course_id, learner_id)
);

-- Trigger for course_enrollments updated_at
drop trigger if exists set_course_enrollments_updated_at on public.course_enrollments;
create trigger set_course_enrollments_updated_at
  before update on public.course_enrollments
  for each row
  execute function public.set_updated_at();

-- Indexes for course_enrollments
create index if not exists course_enrollments_course_id_idx on public.course_enrollments(course_id);
create index if not exists course_enrollments_learner_id_idx on public.course_enrollments(learner_id);
create index if not exists course_enrollments_status_idx on public.course_enrollments(status);


-- 4. lectures table
create table if not exists public.lectures (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  "order" integer not null check ("order" >= 1),
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  scheduled_at timestamptz,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lectures_course_order_unique unique (course_id, "order")
);

-- Trigger for lectures updated_at
drop trigger if exists set_lectures_updated_at on public.lectures;
create trigger set_lectures_updated_at
  before update on public.lectures
  for each row
  execute function public.set_updated_at();

-- Indexes for lectures
create index if not exists lectures_course_id_idx on public.lectures(course_id);


-- 5. lecture_attendance table
create table if not exists public.lecture_attendance (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'present' check (status in ('present', 'absent')),
  joined_at timestamptz,
  left_at timestamptz,
  minutes_attended integer not null default 0 check (minutes_attended >= 0),
  created_at timestamptz not null default now(),
  constraint lecture_attendance_lecture_learner_unique unique (lecture_id, learner_id)
);

-- Indexes for lecture_attendance
create index if not exists lecture_attendance_lecture_id_idx on public.lecture_attendance(lecture_id);
create index if not exists lecture_attendance_learner_id_idx on public.lecture_attendance(learner_id);


-- 6. exams table
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  time_limit_mins integer not null default 0 check (time_limit_mins >= 0),
  pass_mark_percentage numeric not null default 70.0 check (pass_mark_percentage >= 0.0 and pass_mark_percentage <= 100.0),
  status text not null default 'inactive' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for exams updated_at
drop trigger if exists set_exams_updated_at on public.exams;
create trigger set_exams_updated_at
  before update on public.exams
  for each row
  execute function public.set_updated_at();

-- Indexes for exams
create index if not exists exams_course_id_idx on public.exams(course_id);


-- 7. exam_questions table
create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_text text not null,
  options jsonb not null,
  correct_option_idx integer not null check (correct_option_idx >= 0),
  "order" integer not null check ("order" >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exam_questions_exam_order_unique unique (exam_id, "order")
);

-- Trigger for exam_questions updated_at
drop trigger if exists set_exam_questions_updated_at on public.exam_questions;
create trigger set_exam_questions_updated_at
  before update on public.exam_questions
  for each row
  execute function public.set_updated_at();

-- Indexes for exam_questions
create index if not exists exam_questions_exam_id_idx on public.exam_questions(exam_id);


-- 8. exam_attempts table
create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null,
  score_percentage numeric not null check (score_percentage >= 0.0 and score_percentage <= 100.0),
  status text not null check (status in ('passed', 'failed')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Indexes for exam_attempts
create index if not exists exam_attempts_exam_id_idx on public.exam_attempts(exam_id);
create index if not exists exam_attempts_learner_id_idx on public.exam_attempts(learner_id);


-- 9. certificate_requests table
create table if not exists public.certificate_requests (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  score_snapshot numeric check (score_snapshot >= 0.0 and score_snapshot <= 100.0),
  tutor_decision text not null default 'pending' check (tutor_decision in ('pending', 'approved', 'rejected')),
  admin_decision text not null default 'pending' check (admin_decision in ('pending', 'approved', 'rejected')),
  reviewer_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for certificate_requests updated_at
drop trigger if exists set_certificate_requests_updated_at on public.certificate_requests;
create trigger set_certificate_requests_updated_at
  before update on public.certificate_requests
  for each row
  execute function public.set_updated_at();

-- Indexes for certificate_requests
create index if not exists certificate_requests_course_id_idx on public.certificate_requests(course_id);
create index if not exists certificate_requests_learner_id_idx on public.certificate_requests(learner_id);


-- 10. certificates table
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_number text not null unique,
  request_id uuid not null references public.certificate_requests(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  issued_at timestamptz not null default now(),
  verification_metadata jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for certificates
create index if not exists certificates_learner_id_idx on public.certificates(learner_id);
create index if not exists certificates_course_id_idx on public.certificates(course_id);


-- 11. lecture_messages table
create table if not exists public.lecture_messages (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Indexes for lecture_messages
create index if not exists lecture_messages_lecture_id_idx on public.lecture_messages(lecture_id);


-- 12. community_posts table
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for community_posts updated_at
drop trigger if exists set_community_posts_updated_at on public.community_posts;
create trigger set_community_posts_updated_at
  before update on public.community_posts
  for each row
  execute function public.set_updated_at();

-- Indexes for community_posts
create index if not exists community_posts_author_id_idx on public.community_posts(author_id);


-- 13. post_comments table
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for post_comments updated_at
drop trigger if exists set_post_comments_updated_at on public.post_comments;
create trigger set_post_comments_updated_at
  before update on public.post_comments
  for each row
  execute function public.set_updated_at();

-- Indexes for post_comments
create index if not exists post_comments_post_id_idx on public.post_comments(post_id);


-- 14. post_reactions table
create table if not exists public.post_reactions (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

-- Indexes for post_reactions
create index if not exists post_reactions_post_id_idx on public.post_reactions(post_id);


-- Enable Row-Level Security (RLS) on all new tables
alter table public.skill_requests enable row level security;
alter table public.courses enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.lectures enable row level security;
alter table public.lecture_attendance enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.certificate_requests enable row level security;
alter table public.certificates enable row level security;
alter table public.lecture_messages enable row level security;
alter table public.community_posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_reactions enable row level security;


-- ==================== RLS Policies ====================

-- 1. skill_requests policies
create policy "Users can view their own skill requests" on public.skill_requests
  for select using (auth.uid() = requester_id);
create policy "Users can create their own skill requests" on public.skill_requests
  for insert with check (auth.uid() = requester_id);
create policy "Users can update their own pending skill requests" on public.skill_requests
  for update using (auth.uid() = requester_id and status = 'pending');
create policy "Admins can view and update all skill requests" on public.skill_requests
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 2. courses policies
create policy "Anyone can view published courses" on public.courses
  for select using (status = 'published');
create policy "Teachers can view all their own courses" on public.courses
  for select using (auth.uid() = teacher_id);
create policy "Teachers can insert their own courses" on public.courses
  for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update their own courses" on public.courses
  for update using (auth.uid() = teacher_id);
create policy "Teachers can delete their own draft courses" on public.courses
  for delete using (auth.uid() = teacher_id and status = 'draft');

-- 3. course_enrollments policies
create policy "Users can view their own enrollments" on public.course_enrollments
  for select using (auth.uid() = learner_id);
create policy "Teachers can view enrollments for their courses" on public.course_enrollments
  for select using (
    exists (
      select 1 from public.courses
      where courses.id = course_enrollments.course_id and courses.teacher_id = auth.uid()
    )
  );
create policy "Users can enroll themselves in published courses" on public.course_enrollments
  for insert with check (
    auth.uid() = learner_id and
    exists (
      select 1 from public.courses
      where courses.id = course_enrollments.course_id and courses.status = 'published'
    )
  );
create policy "Users can update their own enrollment status" on public.course_enrollments
  for update using (auth.uid() = learner_id);
create policy "Teachers can update enrollments in their courses" on public.course_enrollments
  for update using (
    exists (
      select 1 from public.courses
      where courses.id = course_enrollments.course_id and courses.teacher_id = auth.uid()
    )
  );

-- 4. lectures policies
create policy "Enrolled students and teachers can view lectures" on public.lectures
  for select using (
    exists (
      select 1 from public.course_enrollments
      where course_enrollments.course_id = lectures.course_id and course_enrollments.learner_id = auth.uid()
    ) or exists (
      select 1 from public.courses
      where courses.id = lectures.course_id and courses.teacher_id = auth.uid()
    )
  );
create policy "Teachers can manage lectures" on public.lectures
  for all using (
    exists (
      select 1 from public.courses
      where courses.id = lectures.course_id and courses.teacher_id = auth.uid()
    )
  );

-- 5. lecture_attendance policies
create policy "Learners can view and insert their own attendance" on public.lecture_attendance
  for select using (auth.uid() = learner_id);
create policy "Learners can mark their own attendance" on public.lecture_attendance
  for insert with check (
    auth.uid() = learner_id and
    exists (
      select 1 from public.course_enrollments
      join public.lectures on lectures.course_id = course_enrollments.course_id
      where lectures.id = lecture_attendance.lecture_id and course_enrollments.learner_id = auth.uid()
    )
  );
create policy "Teachers can view and update attendance for their lectures" on public.lecture_attendance
  for all using (
    exists (
      select 1 from public.lectures
      join public.courses on courses.id = lectures.course_id
      where lectures.id = lecture_attendance.lecture_id and courses.teacher_id = auth.uid()
    )
  );

-- 6. exams policies
create policy "Enrolled students and teachers can view exams" on public.exams
  for select using (
    exists (
      select 1 from public.course_enrollments
      where course_enrollments.course_id = exams.course_id and course_enrollments.learner_id = auth.uid()
    ) or exists (
      select 1 from public.courses
      where courses.id = exams.course_id and courses.teacher_id = auth.uid()
    )
  );
create policy "Teachers can manage exams" on public.exams
  for all using (
    exists (
      select 1 from public.courses
      where courses.id = exams.course_id and courses.teacher_id = auth.uid()
    )
  );

-- 7. exam_questions policies
create policy "Teachers can view and manage questions" on public.exam_questions
  for all using (
    exists (
      select 1 from public.exams
      join public.courses on courses.id = exams.course_id
      where exams.id = exam_questions.exam_id and courses.teacher_id = auth.uid()
    )
  );
create policy "Enrolled eligible students can view exam questions" on public.exam_questions
  for select using (
    exists (
      select 1 from public.exams
      join public.course_enrollments on course_enrollments.course_id = exams.course_id
      where exams.id = exam_questions.exam_id
        and course_enrollments.learner_id = auth.uid()
        and course_enrollments.exam_state in ('eligible', 'scheduled')
    )
  );

-- 8. exam_attempts policies
create policy "Learners can view their own attempts" on public.exam_attempts
  for select using (auth.uid() = learner_id);
create policy "Learners can insert their own attempts" on public.exam_attempts
  for insert with check (auth.uid() = learner_id);
create policy "Teachers can view attempts for their exams" on public.exam_attempts
  for select using (
    exists (
      select 1 from public.exams
      join public.courses on courses.id = exams.course_id
      where exams.id = exam_attempts.exam_id and courses.teacher_id = auth.uid()
    )
  );

-- 9. certificate_requests policies
create policy "Learners can view and create their own certificate requests" on public.certificate_requests
  for select using (auth.uid() = learner_id);
create policy "Learners can submit certificate requests" on public.certificate_requests
  for insert with check (auth.uid() = learner_id);
create policy "Teachers can view requests for their courses" on public.certificate_requests
  for select using (
    exists (
      select 1 from public.courses
      where courses.id = certificate_requests.course_id and courses.teacher_id = auth.uid()
    )
  );
create policy "Teachers can update decisions for their courses" on public.certificate_requests
  for update using (
    exists (
      select 1 from public.courses
      where courses.id = certificate_requests.course_id and courses.teacher_id = auth.uid()
    )
  );
create policy "Admins can view and update all certificate requests" on public.certificate_requests
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 10. certificates policies
create policy "Anyone can view/verify certificates" on public.certificates
  for select using (true);
create policy "Only admins can manage certificates" on public.certificates
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 11. lecture_messages policies
create policy "Enrolled students and teachers can view lecture messages" on public.lecture_messages
  for select using (
    exists (
      select 1 from public.lectures
      join public.course_enrollments on course_enrollments.course_id = lectures.course_id
      where lectures.id = lecture_messages.lecture_id and course_enrollments.learner_id = auth.uid()
    ) or exists (
      select 1 from public.lectures
      join public.courses on courses.id = lectures.course_id
      where lectures.id = lecture_messages.lecture_id and courses.teacher_id = auth.uid()
    )
  );
create policy "Enrolled students and teachers can post messages" on public.lecture_messages
  for insert with check (
    auth.uid() = sender_id and (
      exists (
        select 1 from public.lectures
        join public.course_enrollments on course_enrollments.course_id = lectures.course_id
        where lectures.id = lecture_messages.lecture_id and course_enrollments.learner_id = auth.uid()
      ) or exists (
        select 1 from public.lectures
        join public.courses on courses.id = lectures.course_id
        where lectures.id = lecture_messages.lecture_id and courses.teacher_id = auth.uid()
      )
    )
  );

-- 12. community_posts policies
create policy "Anyone can view community posts" on public.community_posts
  for select using (true);
create policy "Authenticated users can create posts" on public.community_posts
  for insert with check (auth.uid() = author_id);
create policy "Authors can update or delete their own posts" on public.community_posts
  for all using (auth.uid() = author_id);

-- 13. post_comments policies
create policy "Anyone can view comments" on public.post_comments
  for select using (true);
create policy "Authenticated users can create comments" on public.post_comments
  for insert with check (auth.uid() = author_id);
create policy "Authors can update or delete their comments" on public.post_comments
  for all using (auth.uid() = author_id);

-- 14. post_reactions policies
create policy "Anyone can view post reactions" on public.post_reactions
  for select using (true);
create policy "Authenticated users can toggle reactions" on public.post_reactions
  for all using (auth.uid() = profile_id);


-- Grant wildcard permissions to administrative roles (must run at database level)
grant all privileges on all tables in schema public to service_role, postgres;
grant all privileges on all sequences in schema public to service_role, postgres;
grant all privileges on all functions in schema public to service_role, postgres;
