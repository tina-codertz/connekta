-- Store first name from signup metadata and backfill existing empty profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_name TEXT;
BEGIN
  resolved_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
    NULLIF(SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 1), ''),
    ''
  );

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, resolved_name)
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(NULLIF(TRIM(EXCLUDED.full_name), ''), profiles.full_name),
        email = EXCLUDED.email,
        updated_at = NOW();

  RETURN NEW;
END;
$$;

UPDATE public.profiles p
SET
  full_name = COALESCE(
    NULLIF(TRIM(p.full_name), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'first_name'), ''),
    NULLIF(SPLIT_PART(COALESCE(u.raw_user_meta_data->>'full_name', ''), ' ', 1), '')
  ),
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND (p.full_name IS NULL OR TRIM(p.full_name) = '');
