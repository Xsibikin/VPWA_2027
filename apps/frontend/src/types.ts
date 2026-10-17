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
  favorite: boolean;
}
export interface ChannelInvite {
  id: string;
  channel: Channel;
  inviter: User;
}
// A direct message as seen by the signed-in user: `user` is the other person.
export interface Dm {
  id: string;
  user: User;
  unreadCount: number;
  favorite: boolean;
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
// A message shown outside its conversation (saved messages, the thread list).
export interface MessageRef {
  message: Message;
  kind: 'channel' | 'dm';
  conversationId: string;
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
