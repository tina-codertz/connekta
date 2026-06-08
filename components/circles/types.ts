import { Circle, CircleMember, Profile } from '@/types/database';

export interface CircleWithDetails extends Circle {
  members: (CircleMember & { profile: Profile })[];
  places_count: number;
}
