-- Migration: 20261001000000_enroll_in_course_atomic.sql
-- Creates an atomic stored procedure for course enrollment.
-- This prevents double-deduction race conditions that occur when enrollment
-- and credit deduction are done as separate sequential queries from the app server.

CREATE OR REPLACE FUNCTION enroll_in_course(p_course_id uuid, p_learner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course       courses%ROWTYPE;
  v_credits      integer;
  v_enrollment   course_enrollments%ROWTYPE;
BEGIN
  -- Lock course row for the duration of this transaction
  SELECT * INTO v_course FROM courses WHERE id = p_course_id FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'course_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF v_course.status <> 'published' THEN
    RAISE EXCEPTION 'course_not_published' USING ERRCODE = 'P0001';
  END IF;

  IF v_course.teacher_id = p_learner_id THEN
    RAISE EXCEPTION 'cannot_enroll_own_course' USING ERRCODE = 'P0001';
  END IF;

  -- Check for an existing active enrollment (prevents double-enrollment)
  SELECT * INTO v_enrollment
  FROM course_enrollments
  WHERE course_id = p_course_id AND learner_id = p_learner_id
  FOR UPDATE;

  IF FOUND AND v_enrollment.status = 'active' THEN
    RAISE EXCEPTION 'already_enrolled' USING ERRCODE = 'P0001';
  END IF;

  -- Lock the learner profile row and read current credits
  SELECT credits INTO v_credits
  FROM profiles
  WHERE id = p_learner_id
  FOR UPDATE;

  IF v_credits < COALESCE(v_course.credit_cost, 25) THEN
    RAISE EXCEPTION 'insufficient_credits' USING ERRCODE = 'P0001';
  END IF;

  -- Deduct credits atomically
  UPDATE profiles
  SET credits = credits - COALESCE(v_course.credit_cost, 25)
  WHERE id = p_learner_id;

  -- Insert or re-activate enrollment
  IF FOUND AND v_enrollment.id IS NOT NULL THEN
    UPDATE course_enrollments
    SET status = 'active', enrolled_at = NOW()
    WHERE id = v_enrollment.id
    RETURNING * INTO v_enrollment;
  ELSE
    INSERT INTO course_enrollments (course_id, learner_id, status)
    VALUES (p_course_id, p_learner_id, 'active')
    RETURNING * INTO v_enrollment;
  END IF;

  RETURN row_to_json(v_enrollment)::jsonb;
END;
$$;

-- Grant execute to the service role used by the backend
GRANT EXECUTE ON FUNCTION enroll_in_course(uuid, uuid) TO service_role;
