-- Match LocateMate profiles from device contact phone numbers.

CREATE OR REPLACE FUNCTION public.normalize_phone_digits(p_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), '');
$$;

CREATE OR REPLACE FUNCTION public.find_profiles_by_phones(p_phones text[])
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

  IF p_phones IS NULL OR array_length(p_phones, 1) IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT p.*
  FROM public.profiles AS p
  WHERE p.id <> v_user_id
    AND public.normalize_phone_digits(p.phone) = ANY (
      SELECT public.normalize_phone_digits(phone)
      FROM unnest(p_phones) AS phone
      WHERE public.normalize_phone_digits(phone) IS NOT NULL
    )
  ORDER BY p.full_name NULLS LAST, p.username NULLS LAST
  LIMIT 50;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_profiles_by_phones(text[]) TO authenticated;
