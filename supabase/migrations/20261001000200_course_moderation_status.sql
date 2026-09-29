-- Migration: 20261001000200_course_moderation_status.sql
-- Adds 'pending_review' to the courses status check constraint.
-- After this migration, the valid transitions are:
--   draft → pending_review (teacher submits for review)
--   pending_review → published (admin approves)
--   pending_review → archived (admin rejects)
--   published → archived (admin or teacher archives)

-- Drop the existing check constraint directly using its exact name from the error
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_status_check;

-- Re-add constraint with the full set of valid statuses
ALTER TABLE courses
  ADD CONSTRAINT courses_status_check
  CHECK (status IN ('draft', 'pending_review', 'published', 'archived'));

-- Back-fill any existing rows that have a NULL or unknown status
UPDATE courses SET status = 'draft' WHERE status IS NULL;
UPDATE courses SET status = 'pending_review' WHERE status NOT IN ('draft', 'pending_review', 'published', 'archived');

-- Add a moderation_note column for admin feedback to teachers (optional but useful)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS moderation_note text;

COMMENT ON COLUMN courses.status IS
  'draft | pending_review | published | archived. Teachers submit as pending_review; admins approve to published or reject to archived.';
