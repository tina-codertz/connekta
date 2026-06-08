import { authStorage } from '@/lib/auth-storage';

const PENDING_FRIEND_INVITER_KEY = 'locatemate-pending-friend-inviter';

export async function setPendingFriendInviter(inviterId: string): Promise<void> {
  await authStorage.setItem(PENDING_FRIEND_INVITER_KEY, inviterId);
}

export async function peekPendingFriendInviter(): Promise<string | null> {
  return authStorage.getItem(PENDING_FRIEND_INVITER_KEY);
}

export async function consumePendingFriendInviter(): Promise<string | null> {
  const inviterId = await peekPendingFriendInviter();
  if (inviterId) {
    await authStorage.removeItem(PENDING_FRIEND_INVITER_KEY);
  }
  return inviterId;
}
