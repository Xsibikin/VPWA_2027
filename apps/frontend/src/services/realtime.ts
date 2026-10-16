import { channels, dms, unread } from '@/mocks/data';
import { channelMembers, insertMessage, isMember, sessionUser, unreadKey } from '@/mocks/db';
import type { Message, User } from '@/types';

// Mock of the future WebSocket connection. Teammates "type" and send messages on a timer, so
// typing previews, notifications and the Offline state can be shown without a server.
// TODO: AdonisJS - replace the simulator with a real socket; keep connect/watch/disconnect
// and the event shapes so that nothing outside this file has to change.
export type RealtimeEvent =
  | { type: 'typing'; conversationId: string; userId: string; draft: string }
  | { type: 'message'; message: Message };

type Listener = (event: RealtimeEvent) => void;
interface Conversation {
  id: string;
  scope: Pick<Message, 'channelId' | 'dmId'>;
  authors: User[];
}

const lines = [
  'Does anyone have five minutes for a quick review?',
  'Just pushed an update — let me know what you think.',
  'Running a few minutes late to stand-up, please start without me.',
  'That worked, thank you!',
  'Sharing the notes from today’s call in a moment.',
  'Coffee break in ten? ☕',
  'Nice work on this one 👏',
  'I’ll take a look right after lunch.',
];
let nextLine = 0;
let listener: Listener | null = null;
let watched = '';
let timer: ReturnType<typeof setTimeout> | undefined;

const random = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = <T>(items: T[]): T | undefined => items[random(0, items.length - 1)];

export function connect(onEvent: Listener) {
  disconnect();
  listener = onEvent;
  plan();
}
// Typing previews are only pushed for the conversation the user has open.
export function watch(conversationId: string) {
  watched = conversationId;
}
export function disconnect() {
  listener = null;
  clearTimeout(timer);
}

// The server pushes nothing to a user whose state is Offline.
function emit(event: RealtimeEvent) {
  if (sessionUser()?.state !== 'Offline') listener?.(structuredClone(event));
}
function conversations(me: User): Conversation[] {
  const canWrite = (user: User) => user.id !== me.id && user.state !== 'Offline';
  return [
    ...channels
      .filter((channel) => isMember(channel.id, me.id))
      .map((channel) => ({
        id: channel.id,
        scope: { channelId: channel.id },
        authors: channelMembers(channel.id).filter(canWrite),
      })),
    ...dms.map((dm) => ({
      id: dm.id,
      scope: { dmId: dm.id },
      authors: [dm.user].filter(canWrite),
    })),
  ].filter((conversation) => conversation.authors.length);
}
function plan() {
  timer = setTimeout(startTyping, random(6000, 12000));
}
function startTyping() {
  const me = sessionUser();
  if (!listener || !me) return;
  const options = conversations(me);
  // Favour the open conversation so that the typing preview is easy to see.
  const conversation =
    (Math.random() < 0.6 && options.find((option) => option.id === watched)) || pick(options);
  const author = conversation && pick(conversation.authors);
  if (!conversation || !author) return plan();
  const line = lines[nextLine++ % lines.length] ?? 'Sounds good!';
  type(conversation, author, Math.random() < 0.3 ? `@${me.nick} ${line}` : line, random(1, 3));
}
function type(conversation: Conversation, author: User, text: string, length: number) {
  if (!listener) return;
  if (conversation.id === watched)
    emit({
      type: 'typing',
      conversationId: conversation.id,
      userId: author.id,
      draft: text.slice(0, length),
    });
  timer =
    length < text.length
      ? setTimeout(() => type(conversation, author, text, length + random(1, 2)), 120)
      : setTimeout(() => send(conversation, author, text), 700);
}
function send(conversation: Conversation, author: User, text: string) {
  const me = sessionUser();
  if (!listener || !me) return;
  // An empty draft tells the client that the author stopped typing.
  emit({ type: 'typing', conversationId: conversation.id, userId: author.id, draft: '' });
  // The author may have been kicked, or the channel closed, while they were typing.
  const { channelId } = conversation.scope;
  if (!channelId || (isMember(channelId, author.id) && isMember(channelId, me.id))) {
    const message = insertMessage(author.id, text, conversation.scope);
    const key = unreadKey(me.id, conversation.id);
    unread[key] = (unread[key] ?? 0) + 1;
    emit({ type: 'message', message });
  }
  plan();
}
