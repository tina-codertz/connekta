-- Fix infinite recursion: policies on profiles/locations queried circle_members,
-- whose policy queried circle_members again under RLS.

CREATE OR REPLACE FUNCTION public.is_circle_member(p_circle_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.circle_members
    WHERE circle_id = p_circle_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_circle_admin(p_circle_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.circle_members
    WHERE circle_id = p_circle_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_circle_owner(p_circle_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.circle_members
    WHERE circle_id = p_circle_id
      AND user_id = auth.uid()
      AND role = 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.users_share_circle(p_user_id uuid)
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
  );
$$;

-- Profiles
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.users_share_circle(id));

-- Circle members
DROP POLICY IF EXISTS "select_circle_members" ON public.circle_members;
CREATE POLICY "select_circle_members" ON public.circle_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_circle_member(circle_id));

DROP POLICY IF EXISTS "insert_circle_members" ON public.circle_members;
CREATE POLICY "insert_circle_members" ON public.circle_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_circle_admin(circle_id));

DROP POLICY IF EXISTS "delete_circle_members" ON public.circle_members;
CREATE POLICY "delete_circle_members" ON public.circle_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_circle_admin(circle_id));

-- Circles
DROP POLICY IF EXISTS "select_circle_member" ON public.circles;
CREATE POLICY "select_circle_member" ON public.circles
  FOR SELECT TO authenticated
  USING (public.is_circle_member(id));

DROP POLICY IF EXISTS "update_circle" ON public.circles;
CREATE POLICY "update_circle" ON public.circles
  FOR UPDATE TO authenticated
  USING (public.is_circle_admin(id));

DROP POLICY IF EXISTS "delete_circle" ON public.circles;
CREATE POLICY "delete_circle" ON public.circles
  FOR DELETE TO authenticated
  USING (public.is_circle_owner(id));

-- Places
DROP POLICY IF EXISTS "select_places" ON public.places;
CREATE POLICY "select_places" ON public.places
  FOR SELECT TO authenticated
  USING (public.is_circle_member(circle_id));

DROP POLICY IF EXISTS "insert_places" ON public.places;
CREATE POLICY "insert_places" ON public.places
  FOR INSERT TO authenticated
  WITH CHECK (public.is_circle_member(circle_id));

DROP POLICY IF EXISTS "update_places" ON public.places;
CREATE POLICY "update_places" ON public.places
  FOR UPDATE TO authenticated
  USING (public.is_circle_member(circle_id));

DROP POLICY IF EXISTS "delete_places" ON public.places;
CREATE POLICY "delete_places" ON public.places
  FOR DELETE TO authenticated
  USING (public.is_circle_member(circle_id));

-- Locations
DROP POLICY IF EXISTS "select_own_locations" ON public.locations;
CREATE POLICY "select_own_locations" ON public.locations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.users_share_circle(user_id));
