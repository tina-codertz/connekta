import { phoneDigitsOnly } from '@/lib/app-invite';
import { supabase } from '@/lib/supabase';
import { consumePendingFriendInviter } from '@/lib/pending-friend-invite';
import type { Profile } from '@/types/database';

const CONTACT_MATCH_BATCH_SIZE = 150;

async function findProfilesInBatches<T>(
  values: T[],
  fetchBatch: (batch: T[]) => Promise<Profile[]>
): Promise<Profile[]> {
  if (!values.length) {
    return [];
  }

  const profilesById = new Map<string, Profile>();

  for (let index = 0; index < values.length; index += CONTACT_MATCH_BATCH_SIZE) {
    const batch = values.slice(index, index + CONTACT_MATCH_BATCH_SIZE);
    const matches = await fetchBatch(batch);
    for (const profile of matches) {
      profilesById.set(profile.id, profile);
    }
  }

  return [...profilesById.values()];
}

export async function loadFriendProfiles(userId: string): Promise<Profile[]> {
  const { data: acceptedRequests } = await supabase
    .from('friend_requests')
    .select('sender_id, receiver_id')
    .eq('status', 'accepted')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

  if (!acceptedRequests?.length) {
    return [];
  }

  const friendIds = acceptedRequests.map((req) =>
    req.sender_id === userId ? req.receiver_id : req.sender_id
  );

  const { data: profiles } = await supabase.from('profiles').select('*').in('id', friendIds);

  return profiles ?? [];
}

export async function searchProfilesForFriends(query: string): Promise<Profile[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const { data, error } = await supabase.rpc('search_profiles_for_friends', {
    p_query: trimmed,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data as Profile[]) ?? [];
}

export async function findProfilesByEmails(emails: string[]): Promise<Profile[]> {
  const normalized = [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))];
  if (!normalized.length) {
    return [];
  }

  return findProfilesInBatches(normalized, async (batch) => {
    const { data, error } = await supabase.rpc('find_profiles_by_emails', {
      p_emails: batch,
    });

    if (error) {
      throw new Error(error.message);
    }

    return (data as Profile[]) ?? [];
  });
}

export async function findProfilesByPhones(phones: string[]): Promise<Profile[]> {
  const normalized = [
    ...new Set(phones.map((phone) => phoneDigitsOnly(phone)).filter((digits) => digits.length >= 7)),
  ];

  if (!normalized.length) {
    return [];
  }

  return findProfilesInBatches(normalized, async (batch) => {
    const { data, error } = await supabase.rpc('find_profiles_by_phones', {
      p_phones: batch,
    });

    if (error) {
      throw new Error(error.message);
    }

    return (data as Profile[]) ?? [];
  });
}

export async function matchContactsToProfiles(options: {
  emails: string[];
  phones: string[];
}): Promise<Profile[]> {
  const [emailMatches, phoneMatches] = await Promise.all([
    findProfilesByEmails(options.emails),
    findProfilesByPhones(options.phones),
  ]);

  const profilesById = new Map<string, Profile>();
  for (const profile of [...emailMatches, ...phoneMatches]) {
    profilesById.set(profile.id, profile);
  }

  return [...profilesById.values()];
}

export async function sendFriendRequest(senderId: string, receiverId: string): Promise<{
  error: Error | null;
}> {
  const { error } = await supabase.from('friend_requests').insert({
    sender_id: senderId,
    receiver_id: receiverId,
  });

  if (!error) {
    return { error: null };
  }

  if (error.code === '23505') {
    return { error: new Error('You have already sent a request to this user') };
  }

  return { error: new Error(error.message || 'Failed to send friend request') };
}

export async function loadPendingFriendRequests(userId: string) {
  const { data: received } = await supabase
    .from('friend_requests')
    .select('*, sender:profiles!friend_requests_sender_id_fkey(*)')
    .eq('receiver_id', userId)
    .eq('status', 'pending');

  const { data: sent } = await supabase
    .from('friend_requests')
    .select('*, receiver:profiles!friend_requests_receiver_id_fkey(*)')
    .eq('sender_id', userId)
    .eq('status', 'pending');

  return {
    received: received ?? [],
    sent: sent ?? [],
  };
}

export async function processPendingFriendInvite(currentUserId: string): Promise<{
  sent: boolean;
  inviterId?: string;
  error?: string;
}> {
  const inviterId = await consumePendingFriendInviter();
  if (!inviterId || inviterId === currentUserId) {
    return { sent: false };
  }

  const { error } = await sendFriendRequest(currentUserId, inviterId);
  if (error) {
    if (error.message.includes('already sent')) {
      return { sent: false, inviterId };
    }
    return { sent: false, inviterId, error: error.message };
  }

  return { sent: true, inviterId };
}
