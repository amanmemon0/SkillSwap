-- Migration: 20261001000300_user_registration_analytics.sql
-- Function and view for single-query user registration timeline analytics grouped by day

CREATE OR REPLACE FUNCTION get_user_registration_stats(days_limit integer DEFAULT 30)
RETURNS TABLE(date text, count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
    count(*)::bigint AS count
  FROM users
  WHERE created_at >= (NOW() - (days_limit || ' days')::interval)
    AND deleted_at IS NULL
  GROUP BY date_trunc('day', created_at)
  ORDER BY date_trunc('day', created_at) ASC;
$$;

CREATE OR REPLACE VIEW user_daily_registrations AS
SELECT
  to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
  count(*)::bigint AS count
FROM users
WHERE deleted_at IS NULL
GROUP BY date_trunc('day', created_at)
ORDER BY date ASC;
