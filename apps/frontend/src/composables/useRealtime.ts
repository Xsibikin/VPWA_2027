import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import * as realtime from '@/services/realtime';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import { useWorkspaceStore } from '@/stores/workspace';
import type { Message } from '@/types';
import { fullName } from '@/utils/user';

const PREVIEW_LENGTH = 80;

// Connects the page to pushed events: incoming messages, typing previews and notifications.
// `refresh` reloads the channel list and the open conversation after an Offline period.
export function useRealtime(refresh: () => Promise<void>) {
  const $q = useQuasar();
  const auth = useAuthStore();
  const workspace = useWorkspaceStore();
  const chat = useChatStore();
  const permission = ref<NotificationPermission | 'unsupported'>(
    'Notification' in window ? Notification.permission : 'unsupported',
  );

  async function enableNotifications() {
    if (permission.value === 'unsupported') return;
    permission.value = await Notification.requestPermission();
  }

  function notify(message: Message) {
    const me = auth.user;
    // Only while the app is not visible, never in DND, and optionally only for mentions.
    if (!me || $q.appVisible || me.state === 'DND') return;
    if (me.mentionOnlyNotif && !message.mentions.includes(me.id)) return;
    if (permission.value !== 'granted') return;
    const author = workspace.members.find((user) => user.id === message.userId);
    const channel = workspace.channels.find((c) => c.id === message.channelId);
    const title = `${author ? fullName(author) : 'New message'}${channel ? ` in #${channel.name}` : ''}`;
    const body =
      message.text.length > PREVIEW_LENGTH
        ? `${message.text.slice(0, PREVIEW_LENGTH)}…`
        : message.text;
    const notification = new Notification(title, { body, ...(author && { icon: author.avatar }) });
    notification.onclick = () => window.focus();
  }

  function onEvent(event: realtime.RealtimeEvent) {
    if (event.type === 'typing') {
      chat.setTyping(event.conversationId, event.userId, event.draft);
      return;
    }
    const { message } = event;
    const kind = message.channelId ? 'channel' : 'dm';
    const id = message.channelId ?? message.dmId ?? '';
    if (chat.receive(message)) workspace.markRead(kind, id);
    else workspace.addUnread(kind, id);
    notify(message);
  }

  onMounted(() => {
    realtime.connect(onEvent);
    if (permission.value === 'default') void enableNotifications();
  });
  onUnmounted(realtime.disconnect);
  watch(() => chat.activeId, realtime.watch, { immediate: true });
  // Nothing is delivered while Offline, so catch up as soon as the user is back.
  watch(
    () => auth.user?.state,
    (state, previous) => {
      if (state === 'Offline') chat.clearTyping();
      else if (previous === 'Offline' && state) void refresh();
    },
  );

  return { permission, enableNotifications };
}
