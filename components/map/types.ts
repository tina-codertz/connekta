export interface FriendMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  battery: number | null;
  isCharging: boolean;
  lastSeen: string;
  avatar?: string | null;
}

export interface CircleMemberLocation {
  id: string;
  name: string;
  avatar?: string | null;
  isSharing: boolean;
  canViewLocation: boolean;
  latitude: number | null;
  longitude: number | null;
  battery: number | null;
  isCharging: boolean;
  lastSeen: string | null;
}
