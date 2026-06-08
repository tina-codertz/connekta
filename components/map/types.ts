export interface FriendMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  battery: number | null;
  isCharging: boolean;
  lastSeen: string;
  avatar?: string;
}
