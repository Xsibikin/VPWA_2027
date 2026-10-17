import type { UserChannel } from '@vpwa/shared';
import type { Channel, Dm, Message, MessageRef, User } from '@/types';
import {
  channels,
  dms,
  favorites,
  findMentions,
  invites,
  memberships,
  messages,
  unread,
  users,
  voteKickVoters,
  voteKicks,
  type ChannelRow,
  type DmRow,
} from './data';

// Server-side rules of the mock backend. services/api.ts (request/response) and
// services/realtime.ts (pushed events) both build on these helpers; once AdonisJS
// is connected this logic lives on the server and the file goes away.

export const SESSION_KEY = 'gather-session';
export const KICK_VOTES_TO_BAN = 3;
const INACTIVITY_LIMIT = 30 * 86400000;

function removeWhere<T>(list: T[], match: (item: T) => boolean) {
  for (let i = list.length - 1; i >= 0; i--) if (match(list[i]!)) list.splice(i, 1);
}

export function sessionUser(): User | undefined {
  const id = localStorage.getItem(SESSION_KEY);
  return users.find((user) => user.id === id);
}
export function currentUser(): User {
  const user = sessionUser();
  if (!user) throw new Error('Please sign in to continue.');
  return user;
}
export const findUserByNick = (nick: string) =>
  users.find((user) => user.nick.toLowerCase() === nick.toLowerCase());

export const membership = (channelId: string, userId: string): UserChannel | undefined =>
  memberships.find((m) => m.channelId === channelId && m.userId === userId);
// A banned user keeps the membership row (with banned = true) but has no access.
export function isMember(channelId: string, userId: string) {
  const row = membership(channelId, userId);
  return !!row && !row.banned;
}
export const channelMembers = (channelId: string) =>
  users.filter((user) => isMember(channelId, user.id));
export function addMember(channelId: string, userId: string) {
  memberships.push({ id: `${channelId}:${userId}`, channelId, userId, banned: false });
}
export function removeMember(channelId: string, userId: string) {
  removeWhere(memberships, (m) => m.channelId === channelId && m.userId === userId);
}

export function clearVotes(channelId: string, targetId?: string) {
  const ids = voteKicks
    .filter((v) => v.channelId === channelId && (!targetId || v.targetId === targetId))
    .map((v) => v.id);
  removeWhere(voteKickVoters, (v) => ids.includes(v.voteKickId));
  removeWhere(voteKicks, (v) => ids.includes(v.id));
}

export function removeChannel(channelId: string) {
  clearVotes(channelId);
  removeWhere(invites, (i) => i.channelId === channelId);
  removeWhere(memberships, (m) => m.channelId === channelId);
  removeWhere(messages, (m) => m.channelId === channelId);
  removeWhere(channels, (c) => c.id === channelId);
  for (const key of Object.keys(unread)) if (key.endsWith(`/${channelId}`)) delete unread[key];
}
// A channel without a new message for more than 30 days stops existing, which frees its name.
export function purgeInactiveChannels() {
  const limit = Date.now() - INACTIVITY_LIMIT;
  for (const channel of [...channels])
    if (new Date(channel.lastActivity).getTime() < limit) removeChannel(channel.id);
}

export const unreadKey = (userId: string, conversationId: string) => `${userId}/${conversationId}`;
export const isFavorite = (userId: string, conversationId: string) =>
  favorites[userId]?.includes(conversationId) ?? false;
export const toChannel = (row: ChannelRow, userId: string): Channel => ({
  ...row,
  unreadCount: unread[unreadKey(userId, row.id)] ?? 0,
  favorite: isFavorite(userId, row.id),
});

// Direct messages the user takes part in, and how one looks from that user's side.
export const dmsOf = (userId: string) => dms.filter((dm) => dm.userIds.includes(userId));
export function toDm(row: DmRow, userId: string): Dm {
  const otherId = row.userIds[0] === userId ? row.userIds[1] : row.userIds[0];
  const user = users.find((u) => u.id === otherId);
  if (!user) throw new Error('This conversation is not available.');
  return {
    id: row.id,
    user,
    unreadCount: unread[unreadKey(userId, row.id)] ?? 0,
    favorite: isFavorite(userId, row.id),
  };
}

// Where a message lives, if the user may still read that conversation.
export function messageRef(message: Message, userId: string): MessageRef | undefined {
  if (message.channelId && isMember(message.channelId, userId))
    return { message, kind: 'channel', conversationId: message.channelId };
  const dmId = message.dmId;
  if (dmId && dmsOf(userId).some((dm) => dm.id === dmId))
    return { message, kind: 'dm', conversationId: dmId };
  return undefined;
}

export function insertMessage(senderId: string, text: string, scope: Partial<Message>): Message {
  if (!text.trim()) throw new Error('Write a message first.');
  const message: Message = {
    id: crypto.randomUUID(),
    userId: senderId,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    mentions: findMentions(text),
    reactions: [],
    replyCount: 0,
    edited: false,
    ...scope,
  };
  messages.push(message);
  const channel = channels.find((c) => c.id === message.channelId);
  if (channel) channel.lastActivity = message.createdAt;
  return message;
}
