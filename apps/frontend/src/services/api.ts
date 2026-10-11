import { channels, dms, messages, users, workspace } from '@/mocks/data';
import type { Channel, Dm, Message, RegisterPayload, User, Workspace } from '@/types';

// The mock database stays behind this boundary. Replace only this file to connect AdonisJS.
const clone = <T>(value: T): T => structuredClone(value);
const delay = <T>(work: () => T): Promise<T> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(clone(work()));
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }, 400);
  });
const currentUser = (): User => {
  const id = localStorage.getItem('gather-session');
  const user = users.find((user) => user.id === id);
  if (!user) throw new Error('Please sign in to continue.');
  return user;
};
export async function login(email: string, password: string): Promise<User> {
  // TODO: AdonisJS - replace with fetch('/api/auth/login', { method: 'POST' })
  return delay(() => {
    const user = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
    const credentials: Record<string, string> = JSON.parse(
      localStorage.getItem('gather-credentials') ?? '{}',
    ) as Record<string, string>;
    if (!user || password !== (user.id === 'u0' ? 'demo1234' : credentials[user.id]))
      throw new Error('Email or password is incorrect. Try the demo account.');
    localStorage.setItem('gather-session', user.id);
    return user;
  });
}
export async function register(payload: RegisterPayload): Promise<User> {
  // TODO: AdonisJS - replace with fetch('/api/auth/register', { method: 'POST' })
  return delay(() => {
    if (users.some((user) => user.email === payload.email))
      throw new Error('An account with this email already exists.');
    const user: User = {
      id: crypto.randomUUID(),
      name: payload.name,
      handle: payload.handle,
      email: payload.email,
      avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(payload.name)}`,
      presence: 'online',
    };
    users.push(user);
    const saved: User[] = JSON.parse(localStorage.getItem('gather-users') ?? '[]') as User[];
    localStorage.setItem('gather-users', JSON.stringify([...saved, user]));
    const credentials = JSON.parse(localStorage.getItem('gather-credentials') ?? '{}') as Record<
      string,
      string
    >;
    localStorage.setItem(
      'gather-credentials',
      JSON.stringify({ ...credentials, [user.id]: payload.password }),
    );
    localStorage.setItem('gather-session', user.id);
    return user;
  });
}
// UI-only registration persistence; no production credentials should be stored this way.
const savedUsers = JSON.parse(localStorage.getItem('gather-users') ?? '[]') as User[];
users.push(...savedUsers);
export async function logout(): Promise<void> {
  // TODO: AdonisJS - replace with fetch('/api/auth/logout', { method: 'POST' })
  return delay(() => {
    localStorage.removeItem('gather-session');
  });
}
export async function me(): Promise<User> {
  // TODO: AdonisJS - replace with fetch('/api/me')
  return delay(currentUser);
}
export async function getWorkspace(): Promise<Workspace> {
  // TODO: AdonisJS - replace with fetch('/api/workspace')
  return delay(() => workspace);
}
export async function listChannels(): Promise<Channel[]> {
  // TODO: AdonisJS - replace with fetch('/api/channels')
  return delay(() => channels);
}
export async function listDms(): Promise<Dm[]> {
  // TODO: AdonisJS - replace with fetch('/api/dms')
  return delay(() => dms);
}
export async function listMembers(channelId: string): Promise<User[]> {
  // TODO: AdonisJS - replace with fetch(`/api/channels/${channelId}/members`)
  return delay(() => {
    if (!channels.some((c) => c.id === channelId)) throw new Error('Channel not found.');
    return users;
  });
}
export async function listChannelMessages(channelId: string): Promise<Message[]> {
  // TODO: AdonisJS - replace with fetch(`/api/channels/${channelId}/messages`)
  return delay(() => messages.filter((m) => m.channelId === channelId && !m.parentId));
}
export async function listDmMessages(dmId: string): Promise<Message[]> {
  // TODO: AdonisJS - replace with fetch(`/api/dms/${dmId}/messages`)
  return delay(() => messages.filter((m) => m.dmId === dmId && !m.parentId));
}
function createMessage(text: string, scope: Partial<Message>): Message {
  if (!text.trim()) throw new Error('Write a message first.');
  const message: Message = {
    id: crypto.randomUUID(),
    userId: currentUser().id,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    reactions: [],
    replyCount: 0,
    edited: false,
    ...scope,
  };
  messages.push(message);
  return message;
}
export async function sendChannelMessage(channelId: string, text: string): Promise<Message> {
  // TODO: AdonisJS - replace with fetch(`/api/channels/${channelId}/messages`, { method: 'POST' })
  return delay(() => createMessage(text, { channelId }));
}
export async function sendDmMessage(dmId: string, text: string): Promise<Message> {
  // TODO: AdonisJS - replace with fetch(`/api/dms/${dmId}/messages`, { method: 'POST' })
  return delay(() => createMessage(text, { dmId }));
}
export async function toggleReaction(messageId: string, emoji: string): Promise<Message> {
  // TODO: AdonisJS - replace with fetch(`/api/messages/${messageId}/reactions`, { method: 'POST' })
  return delay(() => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) throw new Error('Message not found.');
    const id = currentUser().id;
    const reaction = message.reactions.find((r) => r.emoji === emoji);
    if (!reaction) message.reactions.push({ emoji, userIds: [id] });
    else if (reaction.userIds.includes(id))
      reaction.userIds = reaction.userIds.filter((userId) => userId !== id);
    else reaction.userIds.push(id);
    message.reactions = message.reactions.filter((r) => r.userIds.length);
    return message;
  });
}
export async function listThreadReplies(parentMessageId: string): Promise<Message[]> {
  // TODO: AdonisJS - replace with fetch(`/api/messages/${parentMessageId}/thread`)
  return delay(() => messages.filter((m) => m.parentId === parentMessageId));
}
export async function sendThreadReply(parentMessageId: string, text: string): Promise<Message> {
  // TODO: AdonisJS - replace with fetch(`/api/messages/${parentMessageId}/thread`, { method: 'POST' })
  return delay(() => {
    const parent = messages.find((m) => m.id === parentMessageId);
    if (!parent) throw new Error('Thread not found.');
    const reply = createMessage(text, {
      parentId: parentMessageId,
      ...(parent.channelId ? { channelId: parent.channelId } : { dmId: parent.dmId! }),
    });
    parent.replyCount++;
    return reply;
  });
}
export async function createChannel(name: string, topic: string): Promise<Channel> {
  // TODO: AdonisJS - replace with fetch('/api/channels', { method: 'POST' })
  return delay(() => {
    const normalized = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');
    if (!normalized || channels.some((c) => c.name === normalized))
      throw new Error('Choose a unique channel name.');
    const channel = { id: crypto.randomUUID(), name: normalized, topic, unreadCount: 0 };
    channels.push(channel);
    return channel;
  });
}
