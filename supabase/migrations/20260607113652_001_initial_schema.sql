-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_location_enabled BOOLEAN DEFAULT true,
  battery_level INTEGER,
  is_charging BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circles table (like families/groups in Life360)
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'users',
  color TEXT DEFAULT '#3B82F6',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle members
CREATE TABLE circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- Places (saved locations like home, work, school)
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER DEFAULT 100,
  icon TEXT DEFAULT 'map-pin',
  color TEXT DEFAULT '#10B981',
  notifications_enabled BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location history
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2),
  speed DECIMAL(6, 2),
  heading DECIMAL(5, 2),
  altitude DECIMAL(8, 2),
  battery_level INTEGER,
  is_charging BOOLEAN DEFAULT false,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friend requests
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- Circle invitations
CREATE TABLE circle_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts (arrival/departure notifications)
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('arrival', 'departure', 'low_battery', 'sos')),
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR id IN (
    SELECT user_id FROM circle_members WHERE circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
    )
  ));
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Circles policies
CREATE POLICY "select_circle_member" ON circles FOR SELECT
  TO authenticated USING (id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "insert_circle" ON circles FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "update_circle" ON circles FOR UPDATE
  TO authenticated USING (id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));
CREATE POLICY "delete_circle" ON circles FOR DELETE
  TO authenticated USING (id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- Circle members policies
CREATE POLICY "select_circle_members" ON circle_members FOR SELECT
  TO authenticated USING (circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "insert_circle_members" ON circle_members FOR INSERT
  TO authenticated WITH CHECK (circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));
CREATE POLICY "delete_circle_members" ON circle_members FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Places policies
CREATE POLICY "select_places" ON places FOR SELECT
  TO authenticated USING (circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "insert_places" ON places FOR INSERT
  TO authenticated WITH CHECK (circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "update_places" ON places FOR UPDATE
  TO authenticated USING (circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "delete_places" ON places FOR DELETE
  TO authenticated USING (circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
  ));

-- Locations policies
CREATE POLICY "select_own_locations" ON locations FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR user_id IN (
    SELECT user_id FROM circle_members WHERE circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
    )
  ));
CREATE POLICY "insert_own_locations" ON locations FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- Friend requests policies
CREATE POLICY "select_own_requests" ON friend_requests FOR SELECT
  TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "insert_request_sender" ON friend_requests FOR INSERT
  TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "update_request_receiver" ON friend_requests FOR UPDATE
  TO authenticated USING (receiver_id = auth.uid() OR sender_id = auth.uid());

-- Circle invitations policies
CREATE POLICY "select_circle_invites" ON circle_invitations FOR SELECT
  TO authenticated USING (
    inviter_id = auth.uid() OR 
    invitee_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "insert_circle_invites" ON circle_invitations FOR INSERT
  TO authenticated WITH CHECK (circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));
CREATE POLICY "update_circle_invites" ON circle_invitations FOR UPDATE
  TO authenticated USING (invitee_email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Alerts policies
CREATE POLICY "select_alerts" ON alerts FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "insert_alerts" ON alerts FOR INSERT
  TO authenticated WITH CHECK (circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "update_alerts" ON alerts FOR UPDATE
  TO authenticated USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_circle_members_user ON circle_members(user_id);
CREATE INDEX idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX idx_locations_user ON locations(user_id);
CREATE INDEX idx_locations_recorded ON locations(recorded_at DESC);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_circle ON alerts(circle_id);