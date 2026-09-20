-- Add type column to notifications for categorization
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text DEFAULT 'general';

-- Add GRANT for notifications to anon/authenticated so realtime works
GRANT SELECT ON notifications TO authenticated;
GRANT SELECT ON notifications TO anon;
