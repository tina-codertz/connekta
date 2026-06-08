-- SOS alerts: notify all members in the sender's circles via the alerts table.

CREATE OR REPLACE FUNCTION send_sos_alert(
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_name TEXT;
  v_message TEXT;
  v_circle RECORD;
  v_circles_notified INT := 0;
  v_members_notified INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(NULLIF(trim(full_name), ''), split_part(email, '@', 1))
  INTO v_name
  FROM profiles
  WHERE id = v_user_id;

  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_message := format(
      '%s sent an SOS alert. Location: %s, %s',
      COALESCE(v_name, 'Someone'),
      round(p_latitude::numeric, 5),
      round(p_longitude::numeric, 5)
    );
  ELSE
    v_message := format(
      '%s sent an SOS alert. Location unavailable.',
      COALESCE(v_name, 'Someone')
    );
  END IF;

  FOR v_circle IN
    SELECT c.id
    FROM circles c
    INNER JOIN circle_members cm ON cm.circle_id = c.id
    WHERE cm.user_id = v_user_id
  LOOP
    INSERT INTO alerts (circle_id, user_id, type, message)
    VALUES (v_circle.id, v_user_id, 'sos', v_message);

    v_circles_notified := v_circles_notified + 1;
  END LOOP;

  IF v_circles_notified = 0 THEN
    RAISE EXCEPTION 'Join a circle before sending SOS';
  END IF;

  SELECT COUNT(DISTINCT cm.user_id)::INT
  INTO v_members_notified
  FROM circle_members cm
  WHERE cm.circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = v_user_id
  )
  AND cm.user_id != v_user_id;

  RETURN jsonb_build_object(
    'circles_notified', v_circles_notified,
    'members_notified', v_members_notified,
    'message', v_message
  );
END;
$$;

REVOKE ALL ON FUNCTION send_sos_alert(DECIMAL, DECIMAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION send_sos_alert(DECIMAL, DECIMAL) TO authenticated;

-- Enable realtime delivery for in-app SOS notifications.
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
