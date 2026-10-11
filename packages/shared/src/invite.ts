export type InviteStatus = 'accepted' | 'pending' | 'rejected';

export interface Invite {
  id: string; // uuid
  inviterId: string; // uuid FK -> User
  inviteeId: string; // uuid FK -> User
  channelId: string; // uuid FK -> Channel
  createdAt: string; // ISO timestamp
  status: InviteStatus;
}
