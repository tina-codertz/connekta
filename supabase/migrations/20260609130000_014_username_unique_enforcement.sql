-- Enforce globally unique usernames (profiles + auth.users).

CREATE OR REPLACE FUNCTION public.normalize_username_value(p_username text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_username text := lower(trim(p_username));
BEGIN
  IF v_username IS NULL OR v_username = '' THEN
    RETURN NULL;
  END IF;

  IF v_username !~ '^[a-z0-9_]{3,20}$' THEN
    RAISE EXCEPTION 'Username must be 3-20 characters: letters, numbers, underscore only';
  END IF;

  RETURN v_username;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_username_available(p_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_username text;
  v_email text;
BEGIN
  BEGIN
    v_username := public.normalize_username_value(p_username);
  EXCEPTION
    WHEN OTHERS THEN
      RETURN false;
  END;

  v_email := v_username || '@device.locatemate.local';

  IF EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE lower(p.username) = v_username
  ) THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM auth.users AS u
    WHERE lower(u.email) = v_email
  ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_profile_username()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.username IS NOT NULL THEN
    NEW.username := public.normalize_username_value(NEW.username);

    IF EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE lower(p.username) = NEW.username
        AND p.id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'Username already taken';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_username_trigger ON public.profiles;

CREATE TRIGGER enforce_profile_username_trigger
  BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_username();

-- Backfill: lowercase existing usernames so the unique index stays consistent.
UPDATE public.profiles
SET username = lower(trim(username))
WHERE username IS NOT NULL
  AND username <> lower(trim(username));
