import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '@/services/api';
import type { Message, User } from '@/types';

type Kind = 'channel' | 'dm';

export const useChatStore = defineStore('chat', () => {
  const kind = ref<Kind>('channel');
  const activeId = ref('general');
  const messages = ref<Message[]>([]);
  const loading = ref(false);
  // True while the server still has messages older than the ones loaded so far.
  const hasMore = ref(false);
  const loadingOlder = ref(false);
  // Members of the open channel (empty for a direct message).
  const members = ref<User[]>([]);
  // Who is typing in the open conversation: user id -> the text typed so far.
  const typing = ref<Record<string, string>>({});
  const parent = ref<Message | null>(null);
  const replies = ref<Message[]>([]);
  const threadLoading = ref(false);
  const sending = ref(false);
  const unreadCount = ref(0);

  let selection = 0;
  let threadSelection = 0;

  const listMessages = (scope: Kind, id: string, before?: string) =>
    scope === 'channel' ? api.listChannelMessages(id, before) : api.listDmMessages(id, before);

  async function select(nextKind: Kind, id: string, unread = 0) {
    const request = ++selection;
    closeThread();
    kind.value = nextKind;
    activeId.value = id;
    loading.value = true;
    messages.value = [];
    members.value = [];
    typing.value = {};
    hasMore.value = false;
    unreadCount.value = unread;
    try {
      const [page, people] = await Promise.all([
        listMessages(nextKind, id),
        nextKind === 'channel' ? api.listMembers(id) : [],
      ]);
      if (request === selection) {
        messages.value = page.items;
        hasMore.value = page.hasMore;
        members.value = people;
      }
    } finally {
      if (request === selection) loading.value = false;
    }
  }

  // Infinite scroll: fetches the page that precedes the oldest loaded message.
  async function loadOlder() {
    const oldest = messages.value[0];
    if (!oldest || !hasMore.value || loadingOlder.value) return;
    const request = selection;
    loadingOlder.value = true;
    try {
      const page = await listMessages(kind.value, activeId.value, oldest.id);
      if (request === selection) {
        messages.value.unshift(...page.items);
        hasMore.value = page.hasMore;
      }
    } finally {
      loadingOlder.value = false;
    }
  }

  async function loadMembers() {
    if (kind.value !== 'channel') return;
    const id = activeId.value;
    const people = await api.listMembers(id);
    if (id === activeId.value) members.value = people;
  }

  async function send(text: string, thread = false) {
    if (sending.value) return;
    sending.value = true;
    const scopeId = activeId.value;
    const parentId = parent.value?.id;
    try {
      const message =
        thread && parentId
          ? await api.sendThreadReply(parentId, text)
          : kind.value === 'channel'
            ? await api.sendChannelMessage(scopeId, text)
            : await api.sendDmMessage(scopeId, text);
      if (thread) {
        if (parent.value && parent.value.id === parentId) {
          replies.value.push(message);
          parent.value.replyCount++;
        }
        const original = messages.value.find((m) => m.id === parentId);
        if (original && original !== parent.value) original.replyCount++;
      } else if (activeId.value === scopeId) messages.value.push(message);
    } finally {
      sending.value = false;
    }
  }

  // A message pushed by the server. Returns true when it belongs to the open conversation.
  function receive(message: Message) {
    if ((message.channelId ?? message.dmId) !== activeId.value || message.parentId) return false;
    if (!messages.value.some((m) => m.id === message.id)) messages.value.push(message);
    return true;
  }

  function setTyping(conversationId: string, userId: string, draft: string) {
    if (conversationId !== activeId.value) return;
    if (draft) typing.value[userId] = draft;
    else delete typing.value[userId];
  }

  function clearTyping() {
    typing.value = {};
  }

  // Keeps the copy of a user in the member list in step with their profile.
  function syncMember(user: User) {
    const index = members.value.findIndex((member) => member.id === user.id);
    if (index >= 0) members.value[index] = user;
  }

  // The actions behind /invite, /revoke and /kick; they act on the open channel.
  function invite(nick: string) {
    return api.inviteUser(activeId.value, nick);
  }

  async function revoke(nick: string) {
    const user = await api.revokeUser(activeId.value, nick);
    await loadMembers();
    return user;
  }

  async function kick(nick: string) {
    const result = await api.kickUser(activeId.value, nick);
    if (result.banned) await loadMembers();
    return result;
  }

  async function openThread(message: Message) {
    const request = ++threadSelection;
    parent.value = message;
    replies.value = [];
    threadLoading.value = true;
    try {
      const result = await api.listThreadReplies(message.id);
      if (request === threadSelection) replies.value = result;
    } finally {
      if (request === threadSelection) threadLoading.value = false;
    }
  }

  function closeThread() {
    threadSelection++;
    parent.value = null;
    replies.value = [];
    threadLoading.value = false;
  }

  async function react(id: string, emoji: string) {
    const updated = await api.toggleReaction(id, emoji);
    for (const list of [messages.value, replies.value]) {
      const index = list.findIndex((m) => m.id === id);
      if (index >= 0) list[index] = updated;
    }
    if (parent.value?.id === id) parent.value = updated;
  }

  function reset() {
    selection++;
    closeThread();
    messages.value = [];
    members.value = [];
    typing.value = {};
    hasMore.value = false;
    activeId.value = 'general';
    kind.value = 'channel';
  }

  return {
    kind,
    activeId,
    messages,
    loading,
    hasMore,
    loadingOlder,
    members,
    typing,
    parent,
    replies,
    threadLoading,
    sending,
    unreadCount,
    select,
    loadOlder,
    loadMembers,
    send,
    receive,
    setTyping,
    clearTyping,
    syncMember,
    invite,
    revoke,
    kick,
    openThread,
    closeThread,
    react,
    reset,
  };
});
