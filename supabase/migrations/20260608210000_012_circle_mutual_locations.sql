-- Mutual location sharing within a circle: members see each other when both are sharing.

CREATE OR REPLACE FUNCTION public.users_in_same_circle(
  p_user_id uuid,
  p_circle_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.circle_members AS mine
    INNER JOIN public.circle_members AS theirs
      ON mine.circle_id = theirs.circle_id
    WHERE mine.user_id = auth.uid()
      AND theirs.user_id = p_user_id
      AND mine.circle_id = p_circle_id
      AND theirs.circle_id = p_circle_id
  );
$$;

DROP POLICY IF EXISTS "select_own_locations" ON public.locations;
CREATE POLICY "select_own_locations" ON public.locations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      public.users_share_circle(user_id)
      AND EXISTS (
        SELECT 1
        FROM public.profiles AS owner_profile
        WHERE owner_profile.id = locations.user_id
          AND COALESCE(owner_profile.is_location_enabled, true) = true
      )
      AND EXISTS (
        SELECT 1
        FROM public.profiles AS viewer_profile
        WHERE viewer_profile.id = auth.uid()
          AND COALESCE(viewer_profile.is_location_enabled, true) = true
      )
    )
  );

CREATE OR REPLACE FUNCTION public.get_circle_member_locations(p_circle_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  avatar_url text,
  is_location_enabled boolean,
  battery_level integer,
  is_charging boolean,
  last_seen timestamptz,
  latitude numeric,
  longitude numeric,
  accuracy numeric,
  recorded_at timestamptz,
  location_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_viewer_sharing boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_circle_member(p_circle_id) THEN
    RAISE EXCEPTION 'Not a circle member';
  END IF;

  SELECT COALESCE(p.is_location_enabled, true)
  INTO v_viewer_sharing
  FROM public.profiles AS p
  WHERE p.id = auth.uid();

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    COALESCE(p.is_location_enabled, true),
    p.battery_level,
    COALESCE(p.is_charging, false),
    p.last_seen,
    CASE
      WHEN COALESCE(p.is_location_enabled, true)
        AND v_viewer_sharing
        AND latest.id IS NOT NULL
      THEN latest.latitude
      ELSE NULL
    END,
    CASE
      WHEN COALESCE(p.is_location_enabled, true)
        AND v_viewer_sharing
        AND latest.id IS NOT NULL
      THEN latest.longitude
      ELSE NULL
    END,
    latest.accuracy,
    latest.recorded_at,
    latest.id
  FROM public.circle_members AS cm
  INNER JOIN public.profiles AS p ON p.id = cm.user_id
  LEFT JOIN LATERAL (
    SELECT loc.*
    FROM public.locations AS loc
    WHERE loc.user_id = cm.user_id
    ORDER BY loc.recorded_at DESC
    LIMIT 1
  ) AS latest ON true
  WHERE cm.circle_id = p_circle_id
    AND cm.user_id != auth.uid()
  ORDER BY p.full_name NULLS LAST, p.email;
END;
$$;

REVOKE ALL ON FUNCTION public.get_circle_member_locations(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_circle_member_locations(uuid) TO authenticated;
