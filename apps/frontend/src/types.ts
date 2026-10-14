import type {
  Channel as ChannelRecord,
  ChannelType,
  User as UserRecord,
  UserState,
} from '@vpwa/shared';

// Domain records live in @vpwa/shared and mirror docs/data_model.jpg.
// The interfaces below only add what the client needs for rendering.
export type { ChannelType, UserState };

export interface User extends UserRecord {
  avatar: string;
}
export interface Workspace {
  id: string;
  name: string;
  initials: string;
  description: string;
}
export interface Channel extends ChannelRecord {
  topic: string;
  unreadCount: number;
}
export interface ChannelInvite {
  id: string;
  channel: Channel;
  inviter: User;
}
export interface Dm {
  id: string;
  user: User;
  unreadCount: number;
}
export interface Reaction {
  emoji: string;
  userIds: string[];
}
export interface Message {
  id: string;
  channelId?: string;
  dmId?: string;
  parentId?: string;
  userId: string;
  text: string;
  createdAt: string;
  mentions: string[];
  reactions: Reaction[];
  replyCount: number;
  edited: boolean;
}
export interface MessagePage {
  items: Message[];
  hasMore: boolean;
}
export interface RegisterPayload {
  name: string;
  lastName: string;
  nick: string;
  email: string;
  password: string;
}
export interface JoinResult {
  channel: Channel;
  created: boolean;
}
export interface KickResult {
  banned: boolean;
  votes: number;
}
export type UserSettings = Pick<User, 'state' | 'mentionOnlyNotif'>;
