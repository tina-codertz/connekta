-- Realtime location sharing + push token storage for circle notifications.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Enable realtime for live map updates when circle members move.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE locations;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
