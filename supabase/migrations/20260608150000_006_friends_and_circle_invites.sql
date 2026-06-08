-- Friends discovery, profile visibility for friends, and direct circle adds for friends only.

CREATE OR REPLACE FUNCTION public.users_are_friends(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.friend_requests
    WHERE status = 'accepted'
      AND (
        (sender_id = auth.uid() AND receiver_id = p_user_id)
        OR (sender_id = p_user_id AND receiver_id = auth.uid())
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.users_are_friends(uuid) TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.users_share_circle(id)
    OR public.users_are_friends(id)
  );

DROP POLICY IF EXISTS "delete_own_requests" ON public.friend_requests;
CREATE POLICY "delete_own_requests" ON public.friend_requests
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE OR REPLACE FUNCTION public.search_profiles_for_friends(p_query text)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_query text := trim(p_query);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_query IS NULL OR length(v_query) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.*
  FROM public.profiles AS p
  WHERE p.id <> v_user_id
    AND (
      p.email ILIKE '%' || v_query || '%'
      OR p.full_name ILIKE '%' || v_query || '%'
    )
  ORDER BY p.full_name NULLS LAST, p.email
  LIMIT 10;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_profiles_for_friends(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.find_profiles_by_emails(p_emails text[])
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_emails IS NULL OR array_length(p_emails, 1) IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT p.*
  FROM public.profiles AS p
  WHERE p.id <> v_user_id
    AND lower(p.email) = ANY (
      SELECT lower(trim(email))
      FROM unnest(p_emails) AS email
      WHERE trim(email) <> ''
    )
  ORDER BY p.full_name NULLS LAST, p.email
  LIMIT 50;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_profiles_by_emails(text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_friend_to_circle(
  p_circle_id uuid,
  p_friend_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_circle public.circles%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_friend_id IS NULL OR p_friend_id = v_user_id THEN
    RAISE EXCEPTION 'Invalid friend';
  END IF;

  IF NOT public.is_circle_admin(p_circle_id) THEN
    RAISE EXCEPTION 'Only circle admins can add members';
  END IF;

  IF NOT public.users_are_friends(p_friend_id) THEN
    RAISE EXCEPTION 'You can only add friends directly. Share the invite code for everyone else.';
  END IF;

  SELECT *
  INTO v_circle
  FROM public.circles
  WHERE id = p_circle_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Circle not found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.circle_members
    WHERE circle_id = p_circle_id
      AND user_id = p_friend_id
  ) THEN
    RETURN json_build_object(
      'circle_id', v_circle.id,
      'circle_name', v_circle.name,
      'friend_id', p_friend_id,
      'already_member', true
    );
  END IF;

  INSERT INTO public.circle_members (circle_id, user_id, role)
  VALUES (p_circle_id, p_friend_id, 'member');

  RETURN json_build_object(
    'circle_id', v_circle.id,
    'circle_name', v_circle.name,
    'friend_id', p_friend_id,
    'already_member', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_friend_to_circle(uuid, uuid) TO authenticated;
