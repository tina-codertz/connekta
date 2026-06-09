import { supabase } from '@/lib/supabase';
import { normalizeUsername } from '@/lib/device-auth';

export async function checkUsernameAvailable(rawUsername: string): Promise<{
  available: boolean;
  normalized: string | null;
  error?: string;
}> {
  const normalized = normalizeUsername(rawUsername);
  if (!normalized) {
    return {
      available: false,
      normalized: null,
      error: 'Use 3–20 characters: letters, numbers, and underscore only.',
    };
  }

  const { data, error } = await supabase.rpc('is_username_available', {
    p_username: normalized,
  });

  if (error) {
    return { available: false, normalized, error: error.message };
  }

  return { available: Boolean(data), normalized };
}
