-- Add credits to profiles (50 starting credits for all users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 50;

-- Set existing users to 50 credits if they don't have them yet
UPDATE profiles SET credits = 50 WHERE credits IS NULL;

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exchange_id uuid REFERENCES exchanges(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT one_review_per_exchange UNIQUE (reviewer_id, exchange_id)
);

-- Grant access for service role
GRANT ALL ON reviews TO service_role;
GRANT SELECT ON reviews TO anon, authenticated;

-- Update profiles rating after review insert/update/delete
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM reviews
    WHERE reviewee_id = COALESCE(NEW.reviewee_id, OLD.reviewee_id)
  )
  WHERE id = COALESCE(NEW.reviewee_id, OLD.reviewee_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_profile_rating ON reviews;
CREATE TRIGGER trg_update_profile_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_profile_rating();
