import { FriendRequest, Profile } from '@/types/database';

export interface FriendRequestWithProfile extends FriendRequest {
  sender: Profile;
  receiver?: Profile;
}
