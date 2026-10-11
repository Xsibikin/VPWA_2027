export type ChannelType = 'public' | 'private';

export interface Channel {
  id: string; // uuid
  owner: string; // uuid FK -> User
  name: string;
  type: ChannelType;
  lastActivity: string; // ISO timestamp
  createdAt: string; // ISO timestamp
}

export interface UserChannel {
  id: string; // uuid
  channelId: string; // uuid FK -> Channel
  userId: string; // uuid FK -> User
  banned: boolean;
}
