import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

/** First word of a name, used as the default display username. */
export function toFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? '';
}

export function getNameFromUserMetadata(user: User | null | undefined): string | null {
  if (!user?.user_metadata) return null;

  const firstName = user.user_metadata.first_name;
  if (typeof firstName === 'string' && firstName.trim()) {
    return firstName.trim();
  }

  const fullName = user.user_metadata.full_name;
  if (typeof fullName === 'string' && fullName.trim()) {
    return toFirstName(fullName) || fullName.trim();
  }

  return null;
}

export type DisplayNameProfile = Pick<Profile, 'full_name' | 'email'>;

export function getDisplayName(
  profile: DisplayNameProfile | null | undefined,
  user?: User | null
): string {
  if (profile?.full_name?.trim()) {
    return profile.full_name.trim();
  }

  const fromMetadata = getNameFromUserMetadata(user);
  if (fromMetadata) return fromMetadata;

  if (profile?.email) {
    return profile.email.split('@')[0];
  }

  if (user?.email) {
    return user.email.split('@')[0];
  }

  return 'User';
}
