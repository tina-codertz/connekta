-- Allow circle members to mark alerts as read (for the notifications panel).

CREATE OR REPLACE FUNCTION mark_alert_read(p_alert_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM alerts a
    INNER JOIN circle_members cm ON cm.circle_id = a.circle_id
    WHERE a.id = p_alert_id
      AND cm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Alert not found';
  END IF;

  UPDATE alerts
  SET is_read = true
  WHERE id = p_alert_id;
END;
$$;

CREATE OR REPLACE FUNCTION mark_all_alerts_read()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE alerts
  SET is_read = true
  WHERE is_read = false
    AND user_id != auth.uid()
    AND circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION mark_alert_read(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION mark_all_alerts_read() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_alert_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_alerts_read() TO authenticated;
