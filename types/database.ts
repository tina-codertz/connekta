export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          is_location_enabled: boolean;
          battery_level: number | null;
          is_charging: boolean;
          last_seen: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          is_location_enabled?: boolean;
          battery_level?: number | null;
          is_charging?: boolean;
          last_seen?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          is_location_enabled?: boolean;
          battery_level?: number | null;
          is_charging?: boolean;
          last_seen?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      circles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string;
          color: string;
          invite_code: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string;
          color?: string;
          invite_code?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string;
          color?: string;
          invite_code?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      circle_members: {
        Row: {
          id: string;
          circle_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          circle_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'member';
          joined_at?: string;
        };
        Update: {
          id?: string;
          circle_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'member';
          joined_at?: string;
        };
      };
      places: {
        Row: {
          id: string;
          circle_id: string;
          name: string;
          address: string | null;
          latitude: number;
          longitude: number;
          radius: number;
          icon: string;
          color: string;
          notifications_enabled: boolean;
          visible_on_map: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          circle_id: string;
          name: string;
          address?: string | null;
          latitude: number;
          longitude: number;
          radius?: number;
          icon?: string;
          color?: string;
          notifications_enabled?: boolean;
          visible_on_map?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          circle_id?: string;
          name?: string;
          address?: string | null;
          latitude?: number;
          longitude?: number;
          radius?: number;
          icon?: string;
          color?: string;
          notifications_enabled?: boolean;
          visible_on_map?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          user_id: string;
          latitude: number;
          longitude: number;
          accuracy: number | null;
          speed: number | null;
          heading: number | null;
          altitude: number | null;
          battery_level: number | null;
          is_charging: boolean;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          latitude: number;
          longitude: number;
          accuracy?: number | null;
          speed?: number | null;
          heading?: number | null;
          altitude?: number | null;
          battery_level?: number | null;
          is_charging?: boolean;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          latitude?: number;
          longitude?: number;
          accuracy?: number | null;
          speed?: number | null;
          heading?: number | null;
          altitude?: number | null;
          battery_level?: number | null;
          is_charging?: boolean;
          recorded_at?: string;
        };
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
      };
      circle_invitations: {
        Row: {
          id: string;
          circle_id: string;
          inviter_id: string;
          invitee_email: string;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          circle_id: string;
          inviter_id: string;
          invitee_email: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          circle_id?: string;
          inviter_id?: string;
          invitee_email?: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          circle_id: string;
          user_id: string;
          place_id: string | null;
          type: 'arrival' | 'departure' | 'low_battery' | 'sos';
          message: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          circle_id: string;
          user_id: string;
          place_id?: string | null;
          type: 'arrival' | 'departure' | 'low_battery' | 'sos';
          message?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          circle_id?: string;
          user_id?: string;
          place_id?: string | null;
          type?: 'arrival' | 'departure' | 'low_battery' | 'sos';
          message?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      join_circle_by_code: {
        Args: { p_code: string };
        Returns: {
          circle_id: string;
          circle_name: string;
          invite_code: string;
          already_member: boolean;
        };
      };
      add_friend_to_circle: {
        Args: { p_circle_id: string; p_friend_id: string };
        Returns: {
          circle_id: string;
          circle_name: string;
          friend_id: string;
          already_member: boolean;
        };
      };
      search_profiles_for_friends: {
        Args: { p_query: string };
        Returns: Database['public']['Tables']['profiles']['Row'][];
      };
      find_profiles_by_emails: {
        Args: { p_emails: string[] };
        Returns: Database['public']['Tables']['profiles']['Row'][];
      };
      users_are_friends: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      send_sos_alert: {
        Args: {
          p_latitude?: number | null;
          p_longitude?: number | null;
        };
        Returns: {
          circles_notified: number;
          members_notified: number;
          message: string;
        };
      };
      mark_alert_read: {
        Args: { p_alert_id: string };
        Returns: undefined;
      };
      mark_all_alerts_read: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Circle = Database['public']['Tables']['circles']['Row'];
export type CircleMember = Database['public']['Tables']['circle_members']['Row'];
export type Place = Database['public']['Tables']['places']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
export type FriendRequest = Database['public']['Tables']['friend_requests']['Row'];
export type CircleInvitation = Database['public']['Tables']['circle_invitations']['Row'];
export type Alert = Database['public']['Tables']['alerts']['Row'];

export type CircleWithMembers = Circle & {
  members: (CircleMember & { profile: Profile })[];
};

export type MemberWithLocation = CircleMember & {
  profile: Profile;
  latest_location: Location | null;
};
