type AuthMode = 'register' | 'sign-in';

export function mapAuthError(message: string, mode: AuthMode): Error {
  const normalized = message.toLowerCase();

  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return new Error(
      mode === 'register'
        ? 'Too many registration attempts from this device. Wait about an hour, or tap Sign In if you already created this username.'
        : 'Too many sign-in attempts. Please wait a few minutes and try again.'
    );
  }

  if (
    normalized.includes('already registered') ||
    normalized.includes('already been registered') ||
    normalized.includes('user already exists')
  ) {
    return new Error('That username is already taken. Try Sign In instead.');
  }

  if (
    normalized.includes('email not confirmed') ||
    normalized.includes('not confirmed')
  ) {
    return new Error(
      'Email confirmation is enabled in Supabase, but this app uses device usernames only. Turn off "Confirm email" under Authentication → Providers → Email in the Supabase dashboard.'
    );
  }

  if (normalized.includes('invalid login credentials')) {
    return new Error('No account found for this username on this device.');
  }

  return new Error(message);
}

export function isRateLimitError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('rate limit') || normalized.includes('too many requests');
}

export function isExistingUserError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('already registered') ||
    normalized.includes('already been registered') ||
    normalized.includes('user already exists')
  );
}
