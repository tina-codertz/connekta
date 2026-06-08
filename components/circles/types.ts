import { Circle, CircleMember, Profile } from '@/types/database';

export interface CircleWithDetails extends Circle {
  members: (CircleMember & { profile: Profile | null })[];
  places_count: number;
}
