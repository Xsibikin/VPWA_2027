import {
  channels,
  dms,
  invites,
  messages,
  seedUserIds,
  unread,
  users,
  voteKickVoters,
  voteKicks,
  workspace,
  type ChannelRow,
} from '@/mocks/data';
import {
  KICK_VOTES_TO_BAN,
  SESSION_KEY,
  addMember,
  channelMembers,
  clearVotes,
  currentUser,
  findUserByNick,
  insertMessage,
  isMember,
  membership,
  purgeInactiveChannels,
  removeChannel,
  removeMember,
  toChannel,
  unreadKey,
} from '@/mocks/db';
import type {
  Channel,
  ChannelInvite,
  ChannelType,
  Dm,
  JoinResult,
  KickResult,
  Message,
  MessagePage,
  RegisterPayload,
  User,
  UserSettings,
  Workspace,
} from '@/types';

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
const DEMO_PASSWORD = 'demo1234';
const PAGE_SIZE = 30;
const normalizeName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');
// Resolves a channel the signed-in user may read and write in.
function memberChannel(channelId: string): { me: User; row: ChannelRow } {
  const me = currentUser();
  const row = channels.find((c) => c.id === channelId);
  if (!row || !isMember(channelId, me.id)) throw new Error('You are not a member of this channel.');
  return { me, row };
}
// Returns one page of messages that are older than `before` (or the newest page).
function page(all: Message[], before?: string): MessagePage {
  const index = before ? all.findIndex((m) => m.id === before) : -1;
  const end = index >= 0 ? index : all.length;
  const start = Math.max(0, end - PAGE_SIZE);
  return { items: all.slice(start, end), hasMore: start > 0 };
}
function ban(channelId: string, userId: string) {
  const row = membership(channelId, userId);
  if (row) row.banned = true;
  clearVotes(channelId, userId);
}

export async function login(email: string, password: string): Promise<User> {
  // TODO: AdonisJS - replace with fetch('/api/auth/login', { method: 'POST' })
  return delay(() => {
    const user = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
    const credentials: Record<string, string> = JSON.parse(
      localStorage.getItem('gather-credentials') ?? '{}',
    ) as Record<string, string>;
    if (!user || password !== (seedUserIds.has(user.id) ? DEMO_PASSWORD : credentials[user.id]))
      throw new Error('Email or password is incorrect. Try the demo account.');
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  });
}
export async function register(payload: RegisterPayload): Promise<User> {
  // TODO: AdonisJS - replace with fetch('/api/auth/register', { method: 'POST' })
  return delay(() => {
    if (users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase()))
      throw new Error('An account with this email already exists.');
    if (findUserByNick(payload.nick)) throw new Error('This nickname is already taken.');
    const user: User = {
      id: crypto.randomUUID(),
      name: payload.name,
      lastName: payload.lastName,
      nick: payload.nick,
      email: payload.email,
      avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(payload.nick)}`,
      state: 'Online',
      mentionOnlyNotif: false,
    };
    users.push(user);
    addMember('general', user.id);
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
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  });
}
// UI-only registration persistence; no production credentials should be stored this way.
// Entries saved before users had a nickname are skipped.
const savedUsers = (JSON.parse(localStorage.getItem('gather-users') ?? '[]') as User[]).filter(
  (user) => typeof user.nick === 'string',
);
users.push(...savedUsers);
for (const user of savedUsers) addMember('general', user.id);
export async function logout(): Promise<void> {
  // TODO: AdonisJS - replace with fetch('/api/auth/logout', { method: 'POST' })
  return delay(() => {
    localStorage.removeItem(SESSION_KEY);
  });
}
export async function me(): Promise<User> {
  // TODO: AdonisJS - replace with fetch('/api/me')
  return delay(currentUser);
}
export async function updateSettings(settings: Partial<UserSettings>): Promise<User> {
  // TODO: AdonisJS - replace with fetch('/api/me', { method: 'PATCH' })
  return delay(() => Object.assign(currentUser(), settings));
}
export async function getWorkspace(): Promise<Workspace> {
  // TODO: AdonisJS - replace with fetch('/api/workspace')
  return delay(() => workspace);
}
export async function listUsers(): Promise<User[]> {
  // TODO: AdonisJS - replace with fetch('/api/users')
  return delay(() => users);
}
export async function listChannels(): Promise<Channel[]> {
  // TODO: AdonisJS - replace with fetch('/api/channels')
  return delay(() => {
    const me = currentUser();
    purgeInactiveChannels();
    return channels.filter((c) => isMember(c.id, me.id)).map((c) => toChannel(c, me.id));
  });
}
export async function listInvites(): Promise<ChannelInvite[]> {
  // TODO: AdonisJS - replace with fetch('/api/invites')
  return delay(() => {
    const me = currentUser();
    purgeInactiveChannels();
    return invites
      .filter((invite) => invite.inviteeId === me.id && invite.status === 'pending')
      .flatMap((invite) => {
        const row = channels.find((c) => c.id === invite.channelId);
        const inviter = users.find((user) => user.id === invite.inviterId);
        return row && inviter ? [{ id: invite.id, channel: toChannel(row, me.id), inviter }] : [];
      });
  });
}
export async function acceptInvite(inviteId: string): Promise<Channel> {
  // TODO: AdonisJS - replace with fetch(`/api/invites/${inviteId}/accept`, { method: 'POST' })
  return delay(() => {
    const me = currentUser();
    const invite = invites.find(
      (i) => i.id === inviteId && i.inviteeId === me.id && i.status === 'pending',
    );
    const row = invite && channels.find((c) => c.id === invite.channelId);
    if (!invite || !row) throw new Error('This invitation is no longer valid.');
    invite.status = 'accepted';
    if (!membership(row.id, me.id)) addMember(row.id, me.id);
    return toChannel(row, me.id);
  });
}
export async function declineInvite(inviteId: string): Promise<void> {
  // TODO: AdonisJS - replace with fetch(`/api/invites/${inviteId}/decline`, { method: 'POST' })
  return delay(() => {
    const me = currentUser();
    const invite = invites.find((i) => i.id === inviteId && i.inviteeId === me.id);
    if (invite) invite.status = 'rejected';
  });
}
export async function listDms(): Promise<Dm[]> {
  // TODO: AdonisJS - replace with fetch('/api/dms')
  return delay(() => {
    const me = currentUser();
    return dms
      .filter((dm) => dm.user.id !== me.id)
      .map((dm) => ({ ...dm, unreadCount: unread[unreadKey(me.id, dm.id)] ?? 0 }));
  });
}
export async function listMembers(channelId: string): Promise<User[]> {
  // TODO: AdonisJS - replace with fetch(`/api/channels/${channelId}/members`)
  return delay(() => {
    memberChannel(channelId);
    return channelMembers(channelId);
  });
}
export async function listChannelMessages(
  channelId: string,
  before?: string,
): Promise<MessagePage> {
  // TODO: AdonisJS - replace with fetch(`/api/channels/${channelId}/messages?before=${before}`)
  return delay(() => {
    memberChannel(channelId);
    return page(
      messages.filter((m) => m.channelId === channelId && !m.parentId),
      before,
    );
  });
}
export async function listDmMessages(dmId: string, before?: string): Promise<MessagePage> {
  // TODO: AdonisJS - replace with fetch(`/api/dms/${dmId}/messages?before=${before}`)
  return delay(() =>
    page(
      messages.filter((m) => m.dmId === dmId && !m.parentId),
      before,
    ),
  );
}
export async function markRead(conversationId: string): Promise<void> {
  // TODO: AdonisJS - replace with fetch(`/api/conversations/${conversationId}/read`, { method: 'POST' })
  return delay(() => {
    delete unread[unreadKey(currentUser().id, conversationId)];
  });
}
export async function sendChannelMessage(channelId: string, text: string): Promise<Message> {
  // TODO: AdonisJS - replace with fetch(`/api/channels/${channelId}/messages`, { method: 'POST' })
  return delay(() => insertMessage(memberChannel(channelId).me.id, text, { channelId }));
}
export async function sendDmMessage(dmId: string, text: string): Promise<Message> {
  // TODO: AdonisJS - replace with fetch(`/api/dms/${dmId}/messages`, { method: 'POST' })
  return delay(() => insertMessage(currentUser().id, text, { dmId }));
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
    const reply = insertMessage(currentUser().id, text, {
      parentId: parentMessageId,
      ...(parent.channelId ? { channelId: parent.channelId } : { dmId: parent.dmId! }),
    });
    parent.replyCount++;
    return reply;
  });
}
function insertChannel(name: string, topic: string, type: ChannelType, owner: User): ChannelRow {
  const createdAt = new Date().toISOString();
  const row: ChannelRow = {
    id: crypto.randomUUID(),
    name,
    owner: owner.id,
    type,
    topic,
    createdAt,
    lastActivity: createdAt,
  };
  channels.push(row);
  addMember(row.id, owner.id);
  return row;
}
export async function createChannel(
  name: string,
  topic: string,
  type: ChannelType,
): Promise<Channel> {
  // TODO: AdonisJS - replace with fetch('/api/channels', { method: 'POST' })
  return delay(() => {
    const me = currentUser();
    purgeInactiveChannels();
    const normalized = normalizeName(name);
    if (!normalized || channels.some((c) => c.name === normalized))
      throw new Error('Choose a unique channel name.');
    return toChannel(insertChannel(normalized, topic, type, me), me.id);
  });
}
// `/join channelName [private]`: joins a public channel, or creates the channel when the name is free.
export async function joinChannel(name: string, isPrivate: boolean): Promise<JoinResult> {
  // TODO: AdonisJS - replace with fetch('/api/channels/join', { method: 'POST' })
  return delay(() => {
    const me = currentUser();
    purgeInactiveChannels();
    const normalized = normalizeName(name);
    if (!normalized) throw new Error('Enter a channel name.');
    const row = channels.find((c) => c.name === normalized);
    if (!row)
      return {
        channel: toChannel(
          insertChannel(normalized, '', isPrivate ? 'private' : 'public', me),
          me.id,
        ),
        created: true,
      };
    if (isPrivate) throw new Error(`#${row.name} already exists.`);
    const member = membership(row.id, me.id);
    if (member?.banned)
      throw new Error(`You are banned from #${row.name}. Only its admin can invite you back.`);
    if (!member) {
      if (row.type === 'private')
        throw new Error(`#${row.name} is private. Ask its admin for an invitation.`);
      addMember(row.id, me.id);
      for (const invite of invites)
        if (
          invite.channelId === row.id &&
          invite.inviteeId === me.id &&
          invite.status === 'pending'
        )
          invite.status = 'accepted';
    }
    return { channel: toChannel(row, me.id), created: false };
  });
}
// `/cancel`: leaves the channel; when the admin leaves, the channel stops existing.
export async function leaveChannel(channelId: string): Promise<{ deleted: boolean }> {
  // TODO: AdonisJS - replace with fetch(`/api/channels/${channelId}/leave`, { method: 'POST' })
  return delay(() => {
    const { me, row } = memberChannel(channelId);
    const deleted = row.owner === me.id;
    if (deleted) removeChannel(row.id);
    else removeMember(row.id, me.id);
    return { deleted };
  });
}
// `/quit`: only the admin may close the channel.
export async function deleteChannel(channelId: string): Promise<void> {
  // TODO: AdonisJS - replace with fetch(`/api/channels/${channelId}`, { method: 'DELETE' })
  return delay(() => {
    const { me, row } = memberChannel(channelId);
    if (row.owner !== me.id) throw new Error(`Only the admin can close #${row.name}.`);
    removeChannel(row.id);
  });
}
// `/invite nickName`: any member of a public channel, only the admin of a private one.
// An invitation from the admin also lifts a ban.
export async function inviteUser(channelId: string, nick: string): Promise<User> {
  // TODO: AdonisJS - replace with fetch(`/api/channels/${channelId}/invites`, { method: 'POST' })
  return delay(() => {
    const { me, row } = memberChannel(channelId);
    const target = findUserByNick(nick);
    if (!target) throw new Error(`There is no user with the nickname @${nick}.`);
    if (target.id === me.id) throw new Error('You are already here.');
    const isAdmin = row.owner === me.id;
    const member = membership(row.id, target.id);
    if (member && !member.banned) throw new Error(`@${target.nick} is already a member.`);
    if (row.type === 'private' && !isAdmin)
      throw new Error('Only the admin can invite people to a private channel.');
    if (member?.banned) {
      if (!isAdmin)
        throw new Error(`@${target.nick} is banned here. Only the admin can invite them back.`);
      removeMember(row.id, target.id);
    }
    if (
      invites.some(
        (i) => i.channelId === row.id && i.inviteeId === target.id && i.status === 'pending',
      )
    )
      throw new Error(`@${target.nick} already has a pending invitation.`);
    invites.push({
      id: crypto.randomUUID(),
      inviterId: me.id,
      inviteeId: target.id,
      channelId: row.id,
      createdAt: new Date().toISOString(),
      status: 'pending',
    });
    return target;
  });
}
// `/revoke nickName`: the admin of a private channel removes a member (or a pending invitation).
export async function revokeUser(channelId: string, nick: string): Promise<User> {
  // TODO: AdonisJS - replace with fetch(`/api/channels/${channelId}/members/${nick}`, { method: 'DELETE' })
  return delay(() => {
    const { me, row } = memberChannel(channelId);
    if (row.type !== 'private')
      throw new Error('/revoke works in private channels. Use /kick in a public one.');
    if (row.owner !== me.id) throw new Error('Only the admin can remove people from this channel.');
    const target = findUserByNick(nick);
    if (!target) throw new Error(`There is no user with the nickname @${nick}.`);
    if (target.id === me.id) throw new Error('Use /cancel to leave the channel yourself.');
    const invite = invites.find(
      (i) => i.channelId === row.id && i.inviteeId === target.id && i.status === 'pending',
    );
    if (!isMember(row.id, target.id) && !invite)
      throw new Error(`@${target.nick} is not a member of #${row.name}.`);
    if (invite) invite.status = 'rejected';
    removeMember(row.id, target.id);
    return target;
  });
}
// `/kick nickName`: the admin bans at once; in a public channel members vote and the third vote bans.
export async function kickUser(channelId: string, nick: string): Promise<KickResult> {
  // TODO: AdonisJS - replace with fetch(`/api/channels/${channelId}/kicks`, { method: 'POST' })
  return delay(() => {
    const { me, row } = memberChannel(channelId);
    const target = findUserByNick(nick);
    if (!target || !isMember(row.id, target.id))
      throw new Error(`@${nick} is not a member of #${row.name}.`);
    if (target.id === me.id) throw new Error('Use /cancel to leave the channel yourself.');
    if (target.id === row.owner) throw new Error('The channel admin cannot be kicked.');
    if (row.owner === me.id) {
      ban(row.id, target.id);
      return { banned: true, votes: 0 };
    }
    if (row.type === 'private')
      throw new Error('Only the admin can remove people from a private channel.');
    let vote = voteKicks.find((v) => v.channelId === row.id && v.targetId === target.id);
    if (!vote) {
      vote = {
        id: crypto.randomUUID(),
        channelId: row.id,
        targetId: target.id,
        createdAt: new Date().toISOString(),
      };
      voteKicks.push(vote);
    }
    const voteId = vote.id;
    if (voteKickVoters.some((v) => v.voteKickId === voteId && v.userId === me.id))
      throw new Error(`You already voted to kick @${target.nick}.`);
    voteKickVoters.push({ id: crypto.randomUUID(), voteKickId: voteId, userId: me.id });
    const votes = voteKickVoters.filter((v) => v.voteKickId === voteId).length;
    const banned = votes >= KICK_VOTES_TO_BAN;
    if (banned) ban(row.id, target.id);
    return { banned, votes };
  });
}
