-- Invite codes: anyone with the code can join a circle.

ALTER TABLE public.circles
  ADD COLUMN IF NOT EXISTS invite_code TEXT;

CREATE OR REPLACE FUNCTION public.generate_circle_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  candidate TEXT;
BEGIN
  LOOP
    candidate := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.circles WHERE invite_code = candidate
    );
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_circle_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := public.generate_circle_invite_code();
  ELSE
    NEW.invite_code := upper(trim(NEW.invite_code));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS circles_set_invite_code ON public.circles;
CREATE TRIGGER circles_set_invite_code
  BEFORE INSERT ON public.circles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_circle_invite_code();

UPDATE public.circles
SET invite_code = public.generate_circle_invite_code()
WHERE invite_code IS NULL OR invite_code = '';

ALTER TABLE public.circles
  ALTER COLUMN invite_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS circles_invite_code_key
  ON public.circles (invite_code);

-- Creators can read their circle before the first member row exists (e.g. .insert().select()).
DROP POLICY IF EXISTS "select_circle_member" ON public.circles;
CREATE POLICY "select_circle_member" ON public.circles
  FOR SELECT TO authenticated
  USING (
    public.is_circle_member(id)
    OR created_by = auth.uid()
  );

-- Let circle creators add themselves as the first owner.
DROP POLICY IF EXISTS "insert_circle_members" ON public.circle_members;
CREATE POLICY "insert_circle_members" ON public.circle_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_circle_admin(circle_id)
    OR (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.circles
        WHERE id = circle_id
          AND created_by = auth.uid()
      )
    )
  );

-- Join a circle using its invite code.
CREATE OR REPLACE FUNCTION public.join_circle_by_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_circle public.circles%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_code IS NULL OR trim(p_code) = '' THEN
    RAISE EXCEPTION 'Invite code is required';
  END IF;

  SELECT *
  INTO v_circle
  FROM public.circles
  WHERE invite_code = upper(trim(p_code));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.circle_members
    WHERE circle_id = v_circle.id
      AND user_id = v_user_id
  ) THEN
    RETURN json_build_object(
      'circle_id', v_circle.id,
      'circle_name', v_circle.name,
      'invite_code', v_circle.invite_code,
      'already_member', true
    );
  END IF;

  INSERT INTO public.circle_members (circle_id, user_id, role)
  VALUES (v_circle.id, v_user_id, 'member');

  RETURN json_build_object(
    'circle_id', v_circle.id,
    'circle_name', v_circle.name,
    'invite_code', v_circle.invite_code,
    'already_member', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_circle_by_code(TEXT) TO authenticated;
