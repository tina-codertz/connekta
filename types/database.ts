export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  device_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_location_enabled: boolean;
  battery_level: number | null;
  is_charging: boolean;
  last_seen: string | null;
  expo_push_token: string | null;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Relationships: [];
        Insert: {
          id: string;
          email?: string | null;
          username?: string | null;
          device_id?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          is_location_enabled?: boolean;
          battery_level?: number | null;
          is_charging?: boolean;
          last_seen?: string | null;
          expo_push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          username?: string | null;
          device_id?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          is_location_enabled?: boolean;
          battery_level?: number | null;
          is_charging?: boolean;
          last_seen?: string | null;
          expo_push_token?: string | null;
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: 'circle_members_circle_id_fkey';
            columns: ['circle_id'];
            isOneToOne: false;
            referencedRelation: 'circles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'circle_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: 'friend_requests_receiver_id_fkey';
            columns: ['receiver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friend_requests_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: 'alerts_circle_id_fkey';
            columns: ['circle_id'];
            isOneToOne: false;
            referencedRelation: 'circles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'alerts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
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
      is_username_available: {
        Args: { p_username: string };
        Returns: boolean;
      };
      search_profiles_for_friends: {
        Args: { p_query: string };
        Returns: ProfileRow[];
      };
      find_profiles_by_emails: {
        Args: { p_emails: string[] };
        Returns: ProfileRow[];
      };
      find_profiles_by_phones: {
        Args: { p_phones: string[] };
        Returns: ProfileRow[];
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
      get_circle_member_locations: {
        Args: { p_circle_id: string };
        Returns: {
          user_id: string;
          full_name: string | null;
          email: string;
          avatar_url: string | null;
          is_location_enabled: boolean;
          battery_level: number | null;
          is_charging: boolean;
          last_seen: string | null;
          latitude: number | null;
          longitude: number | null;
          accuracy: number | null;
          recorded_at: string | null;
          location_id: string | null;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Profile = ProfileRow;
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
