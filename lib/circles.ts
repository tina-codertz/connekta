import { supabase } from '@/lib/supabase';
import type { CircleMember, Profile } from '@/types/database';

type CircleMemberRow = CircleMember & { profiles: Profile | null };

export function mapCircleMembers(
  rows: CircleMemberRow[] | null | undefined
): (CircleMember & { profile: Profile | null })[] {
  return (rows ?? []).map(({ profiles, ...member }) => ({
    ...member,
    profile: profiles,
  }));
}

export interface JoinCircleResult {
  circle_id: string;
  circle_name: string;
  invite_code: string;
  already_member: boolean;
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s/g, '');
}

export async function joinCircleByCode(code: string): Promise<{
  data: JoinCircleResult | null;
  error: Error | null;
}> {
  const normalized = normalizeInviteCode(code);
  if (!normalized) {
    return { data: null, error: new Error('Please enter an invite code') };
  }

  const { data, error } = await supabase.rpc('join_circle_by_code', {
    p_code: normalized,
  });

  if (error) {
    const message =
      error.message.includes('Invalid invite code')
        ? 'Invalid invite code. Check the code and try again.'
        : error.message;
    return { data: null, error: new Error(message) };
  }

  return { data: data as JoinCircleResult, error: null };
}
