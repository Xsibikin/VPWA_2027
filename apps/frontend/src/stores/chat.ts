import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '@/services/api';
import type { Message } from '@/types';

export const useChatStore = defineStore('chat', () => {
  const kind = ref<'channel' | 'dm'>('channel');
  const activeId = ref('general');
  const messages = ref<Message[]>([]);
  const loading = ref(false);
  const parent = ref<Message | null>(null);
  const replies = ref<Message[]>([]);
  const threadLoading = ref(false);
  const sending = ref(false);
  const unreadCount = ref(0);

  let selection = 0;
  let threadSelection = 0;

  async function select(nextKind: 'channel' | 'dm', id: string, unread = 0) {
    const request = ++selection;
    closeThread();
    kind.value = nextKind;
    activeId.value = id;
    loading.value = true;
    messages.value = [];
    unreadCount.value = unread;
    try {
      const result = await (nextKind === 'channel'
        ? api.listChannelMessages(id)
        : api.listDmMessages(id));
      if (request === selection) messages.value = result;
    } finally {
      if (request === selection) loading.value = false;
    }
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
    activeId.value = 'general';
    kind.value = 'channel';
  }

  return {
    kind,
    activeId,
    messages,
    loading,
    parent,
    replies,
    threadLoading,
    sending,
    unreadCount,
    select,
    send,
    openThread,
    closeThread,
    react,
    reset,
  };
});
