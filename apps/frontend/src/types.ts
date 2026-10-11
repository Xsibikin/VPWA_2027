export interface User {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatar: string;
  presence: 'online' | 'away' | 'offline';
}
export interface Workspace {
  id: string;
  name: string;
  initials: string;
  description: string;
}
export interface Channel {
  id: string;
  name: string;
  topic: string;
  unreadCount: number;
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
  reactions: Reaction[];
  replyCount: number;
  edited: boolean;
}
export interface RegisterPayload {
  name: string;
  handle: string;
  email: string;
  password: string;
}
