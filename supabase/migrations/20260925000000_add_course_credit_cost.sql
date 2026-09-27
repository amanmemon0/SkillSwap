-- Store the number of SkillSwap credits a learner must pay to enroll.
alter table public.courses
  add column if not exists credit_cost integer not null default 25
  check (credit_cost >= 0 and credit_cost <= 10000);

-- Make the newly added column available to the PostgREST API immediately.
notify pgrst, 'reload schema';
