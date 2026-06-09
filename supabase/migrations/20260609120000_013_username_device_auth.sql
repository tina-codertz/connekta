-- Username + device identity for passwordless client auth.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS device_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN email DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.is_username_available(p_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_username text := lower(trim(p_username));
BEGIN
  IF v_username IS NULL OR length(v_username) < 3 THEN
    RETURN false;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE lower(p.username) = v_username
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text := lower(trim(COALESCE(NEW.raw_user_meta_data->>'username', '')));
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, device_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), v_username),
    NULLIF(v_username, ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'device_id'), '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    username = COALESCE(EXCLUDED.username, public.profiles.username),
    device_id = COALESCE(EXCLUDED.device_id, public.profiles.device_id),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

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
      p.username ILIKE '%' || v_query || '%'
      OR p.full_name ILIKE '%' || v_query || '%'
      OR p.email ILIKE '%' || v_query || '%'
    )
  ORDER BY p.username NULLS LAST, p.full_name NULLS LAST
  LIMIT 10;
END;
$$;
