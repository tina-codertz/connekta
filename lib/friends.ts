import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

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

  const { data, error } = await supabase.rpc('find_profiles_by_emails', {
    p_emails: normalized,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data as Profile[]) ?? [];
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
