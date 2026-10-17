<script setup lang="ts">
import { computed, nextTick, onMounted, provide, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QScrollArea } from 'quasar';
import { useAuthStore } from '@/stores/auth';
import { useWorkspaceStore } from '@/stores/workspace';
import { useChatStore } from '@/stores/chat';
import ChannelListItem from '@/components/ChannelListItem.vue';
import ChatMessage from '@/components/ChatMessage.vue';
import DmListItem from '@/components/DmListItem.vue';
import MessageComposer from '@/components/MessageComposer.vue';
import MessageDigest from '@/components/MessageDigest.vue';
import TypingIndicator from '@/components/TypingIndicator.vue';
import { useChannelCommands } from '@/composables/useChannelCommands';
import { useRealtime } from '@/composables/useRealtime';
import { directMessagesKey } from '@/injectionKeys';
import { COMMANDS, isCommand } from '@/services/commands';
import type { Channel, ChannelInvite, MessageRef, UserState } from '@/types';
import { fullName, presenceClass, stateLabels } from '@/utils/user';

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();
const workspace = useWorkspaceStore();
const chat = useChatStore();
const drawer = ref($q.screen.gt.sm);
// On wide screens the sidebar collapses to a column of avatars instead of disappearing.
const mini = ref(false);
const MINI_WIDTH = 76;
const SIDEBAR_WIDTH = 260;
const sidebarSearch = ref('');
const messageSearch = ref('');
const showSearch = ref(false);
const favoritesOpen = ref(true);
const channelsOpen = ref(true);
const dmsOpen = ref(true);
// 'members' lists the people in the open channel.
// 'members' lists the people in the open channel, 'people' everyone you can start a DM with.
const dialog = ref<
  'channel' | 'members' | 'people' | 'info' | 'settings' | 'saved' | 'threads' | null
>(null);
const peopleSearch = ref('');
// Messages shown in the Saved / Threads dialog.
const digestItems = ref<MessageRef[]>([]);
const digestLoading = ref(false);
const channelName = ref('');
const channelTopic = ref('');
const channelPrivate = ref(false);
const creating = ref(false);
const runningCommand = ref(false);
const scroll = ref<QScrollArea>();
const scrollTarget = ref<Element>();
const nearBottom = ref(true);
const threadScroll = ref<QScrollArea>();
const composer = ref<InstanceType<typeof MessageComposer>>();
const replyComposer = ref<InstanceType<typeof MessageComposer>>();
const split = ref(67);
const states: UserState[] = ['Online', 'DND', 'Offline'];
const stateOptions = states.map((value) => ({ value, label: stateLabels[value] }));
const activeChannel = computed(() =>
  chat.kind === 'channel' ? workspace.channels.find((c) => c.id === chat.activeId) : undefined,
);
const activeDm = computed(() => workspace.dms.find((d) => d.id === chat.activeId));
const currentConversation = computed(() =>
  chat.kind === 'channel' ? activeChannel.value : activeDm.value,
);
const dmName = computed(() => (activeDm.value ? fullName(activeDm.value.user) : 'your teammate'));
const title = computed(() =>
  chat.kind === 'channel' ? (activeChannel.value?.name ?? 'general') : dmName.value,
);
const topic = computed(() =>
  chat.kind === 'channel' ? activeChannel.value?.topic : `A conversation with ${dmName.value}`,
);
const channelAdmin = computed(() =>
  workspace.members.find((user) => user.id === activeChannel.value?.owner),
);
// People the composer suggests after "@": the channel's members, or the other person in a DM.
const mentionCandidates = computed(() =>
  (chat.kind === 'channel' ? chat.members : activeDm.value ? [activeDm.value.user] : []).filter(
    (user) => user.id !== auth.user?.id,
  ),
);
// Nick suggestions for command arguments: only people the command can actually act on.
const commandUsers = computed(() => {
  if (chat.kind !== 'channel') return {};
  const outside = workspace.members.filter(
    (user) => !chat.members.some((member) => member.id === user.id),
  );
  return { invite: outside, kick: mentionCandidates.value, revoke: mentionCandidates.value };
});
const headerAvatars = computed(() => chat.members.slice(0, 3));
// "New message" dialog: everyone except you, filtered by name or nick.
const people = computed(() => {
  const term = peopleSearch.value.trim().toLowerCase();
  return workspace.members.filter(
    (user) =>
      user.id !== auth.user?.id &&
      [user.nick, fullName(user)].some((value) => value.toLowerCase().includes(term)),
  );
});
const listedMembers = computed(() => (dialog.value === 'people' ? people.value : chat.members));
function openPeople() {
  peopleSearch.value = '';
  dialog.value = 'people';
}
const matchesSearch = (name: string) =>
  name.toLowerCase().includes(sidebarSearch.value.toLowerCase());
const filteredChannels = computed(() => workspace.channels.filter((c) => matchesSearch(c.name)));
const filteredInvites = computed(() =>
  workspace.invites.filter((invite) => matchesSearch(invite.channel.name)),
);
const filteredDms = computed(() => workspace.dms.filter((d) => matchesSearch(fullName(d.user))));
// Favourites get their own section and are not repeated below it.
const favoriteChannels = computed(() => filteredChannels.value.filter((c) => c.favorite));
const favoriteDms = computed(() => filteredDms.value.filter((d) => d.favorite));
const otherChannels = computed(() => filteredChannels.value.filter((c) => !c.favorite));
const otherDms = computed(() => filteredDms.value.filter((d) => !d.favorite));
const miniActive = computed(() => mini.value && $q.screen.gt.sm);
// Width the chat area has to leave free for the sidebar (0 when it floats over the page).
const sidebarWidth = computed(() =>
  !drawer.value || $q.screen.lt.md ? 0 : miniActive.value ? MINI_WIDTH : SIDEBAR_WIDTH,
);
// Collapsed sidebar: one avatar per conversation, grouped like the full list.
interface MiniItem {
  key: string;
  kind: 'channel' | 'dm';
  id: string;
  label: string;
  avatar: string | null;
  letter: string;
  unread: number;
  group: 'invites' | 'favorites' | 'channels' | 'dms';
}
const channelItem = (channel: Channel, group: MiniItem['group']): MiniItem => ({
  key: `${group}-${channel.id}`,
  kind: 'channel',
  id: channel.id,
  label: `${channel.type === 'private' ? '🔒 ' : '#'}${channel.name}`,
  avatar: null,
  letter: channel.name.charAt(0).toUpperCase(),
  unread: channel.unreadCount,
  group,
});
const miniItems = computed<MiniItem[]>(() => [
  ...workspace.invites.map((invite) => ({
    ...channelItem(invite.channel, 'invites'),
    label: `Invitation to #${invite.channel.name}`,
  })),
  ...favoriteChannels.value.map((c) => channelItem(c, 'favorites')),
  ...favoriteDms.value.map((dm) => ({
    key: `favorites-${dm.id}`,
    kind: 'dm' as const,
    id: dm.id,
    label: fullName(dm.user),
    avatar: dm.user.avatar,
    letter: '',
    unread: dm.unreadCount,
    group: 'favorites' as const,
  })),
  ...otherChannels.value.map((c) => channelItem(c, 'channels')),
  ...otherDms.value.map((dm) => ({
    key: `dms-${dm.id}`,
    kind: 'dm' as const,
    id: dm.id,
    label: fullName(dm.user),
    avatar: dm.user.avatar,
    letter: '',
    unread: dm.unreadCount,
    group: 'dms' as const,
  })),
]);
const filteredMessages = computed(() =>
  chat.messages.filter((m) => m.text.toLowerCase().includes(messageSearch.value.toLowerCase())),
);
const totalUnread = computed(() => workspace.channels.reduce((sum, c) => sum + c.unreadCount, 0));
const threadOpen = computed({
  get: () => !!chat.parent,
  set: (value: boolean) => {
    if (!value) chat.closeThread();
  },
});
const mobileThread = computed(() => $q.screen.lt.lg);
watch(
  () => [!!chat.parent, $q.screen.width, sidebarWidth.value],
  () => {
    const availableWidth = $q.screen.width - 72 - sidebarWidth.value;
    split.value = Math.max(45, Math.min(78, (1 - 360 / availableWidth) * 100));
  },
);
function notifyError(error: unknown) {
  $q.notify({ type: 'negative', message: (error as Error).message });
}
// Opens the direct message with someone; the conversation is created the first time.
async function messageUser(userId: string) {
  dialog.value = null;
  try {
    const dm = await workspace.openDirectMessage(userId);
    await select('dm', dm.id, dm.unreadCount);
  } catch (error) {
    notifyError(error);
  }
}
// The "Message" button in a profile card uses this (see injectionKeys.ts).
provide(directMessagesKey, {
  canMessage: (userId) => userId !== auth.user?.id,
  open: messageUser,
});
function toggleSidebar() {
  if ($q.screen.lt.md) drawer.value = !drawer.value;
  else {
    drawer.value = true;
    mini.value = !mini.value;
  }
}
function openMini(item: MiniItem) {
  // An invitation needs the full list to show its Accept / Decline buttons.
  if (item.group === 'invites') mini.value = false;
  else void select(item.kind, item.id, item.unread);
}
async function toggleFavorite(kind: 'channel' | 'dm', id: string) {
  try {
    await workspace.toggleFavorite(kind, id);
  } catch (error) {
    notifyError(error);
  }
}
async function openDigest(kind: 'saved' | 'threads') {
  dialog.value = kind;
  digestItems.value = [];
  digestLoading.value = true;
  try {
    digestItems.value =
      kind === 'saved' ? await workspace.loadSaved() : await workspace.loadThreads();
  } catch (error) {
    notifyError(error);
  } finally {
    digestLoading.value = false;
  }
}
// Opens the conversation of a saved message or a thread (and the thread itself).
async function openRef(item: MessageRef) {
  const showThread = dialog.value === 'threads';
  dialog.value = null;
  const unread =
    (item.kind === 'channel' ? workspace.channels : workspace.dms).find(
      (conversation) => conversation.id === item.conversationId,
    )?.unreadCount ?? 0;
  await select(item.kind, item.conversationId, unread);
  if (showThread) await chat.openThread(item.message).catch(notifyError);
}
async function removeSaved(item: MessageRef) {
  try {
    await workspace.toggleSaved(item.message.id);
    digestItems.value = digestItems.value.filter((ref) => ref.message.id !== item.message.id);
  } catch (error) {
    notifyError(error);
  }
}
async function select(kind: 'channel' | 'dm', id: string, unread: number) {
  messageSearch.value = '';
  showSearch.value = false;
  if ($q.screen.lt.md) drawer.value = false;
  try {
    await chat.select(kind, id, unread);
    workspace.markRead(kind, id);
  } catch (error) {
    notifyError(error);
  }
}
// Opens #general when the user is in it, otherwise the first conversation there is.
async function openFirst() {
  const channel = workspace.channels.find((c) => c.name === 'general') ?? workspace.channels[0];
  const dm = workspace.dms[0];
  if (channel) await select('channel', channel.id, channel.unreadCount);
  else if (dm) await select('dm', dm.id, dm.unreadCount);
}
// After an Offline period: reload the channel list and the open conversation.
async function refresh() {
  try {
    await workspace.load();
    const current = (chat.kind === 'channel' ? workspace.channels : workspace.dms).find(
      (item) => item.id === chat.activeId,
    );
    if (current) await select(chat.kind, current.id, current.unreadCount);
    else await openFirst();
  } catch (error) {
    notifyError(error);
  }
}
const commands = useChannelCommands({
  open: (channel) => select('channel', channel.id, channel.unreadCount),
  openFirst,
  showMembers: () => {
    dialog.value = 'members';
  },
});
const { permission, enableNotifications } = useRealtime(refresh);
// Shows the outcome of a command or a channel action as a toast.
async function report(action: Promise<string>) {
  try {
    const message = await action;
    if (message) $q.notify({ message, icon: 'tag', color: 'primary' });
    return true;
  } catch (error) {
    notifyError(error);
    return false;
  }
}
function confirmLeave(channel: Channel) {
  $q.dialog({
    title: `Leave #${channel.name}?`,
    message:
      channel.owner === auth.user?.id
        ? 'You are the admin of this channel. If you leave, it is closed for everyone.'
        : 'The channel will disappear from your list.',
    cancel: true,
    ok: 'Leave',
  }).onOk(() => void report(commands.leave(channel)));
}
function confirmClose(channel: Channel) {
  $q.dialog({
    title: `Close #${channel.name}?`,
    message: 'The channel and its messages are removed for everyone.',
    cancel: true,
    ok: 'Close channel',
  }).onOk(() => void report(commands.close(channel)));
}
async function acceptInvite(invite: ChannelInvite) {
  try {
    const channel = await workspace.acceptInvite(invite.id);
    await select('channel', channel.id, channel.unreadCount);
  } catch (error) {
    notifyError(error);
  }
}
async function declineInvite(invite: ChannelInvite) {
  try {
    await workspace.declineInvite(invite.id);
  } catch (error) {
    notifyError(error);
  }
}
async function updateSettings(settings: Parameters<typeof auth.updateSettings>[0]) {
  try {
    await auth.updateSettings(settings);
    if (auth.user) {
      workspace.syncMember(auth.user);
      chat.syncMember(auth.user);
    }
  } catch (error) {
    notifyError(error);
  }
}
async function send(text: string, thread = false) {
  // Anything that starts with a slash in the main command line is a command, not a message.
  if (!thread && isCommand(text)) {
    if (runningCommand.value) return;
    runningCommand.value = true;
    if (await report(commands.run(text))) composer.value?.clear();
    runningCommand.value = false;
    return;
  }
  try {
    await chat.send(text, thread);
    (thread ? replyComposer.value : composer.value)?.clear();
    $q.notify({
      message: thread ? 'Reply sent.' : 'Message sent.',
      icon: 'check_circle',
      timeout: 1300,
      color: 'primary',
    });
  } catch (error) {
    notifyError(error);
  }
}
async function logout() {
  try {
    await auth.logout();
    chat.reset();
    $q.notify({ message: 'Signed out. See you soon!', icon: 'waving_hand' });
    await router.push('/auth');
  } catch (error) {
    notifyError(error);
  }
}
function toggleTheme() {
  $q.dark.toggle();
  localStorage.setItem('gather-theme', $q.dark.isActive ? 'dark' : 'light');
}
async function addChannel() {
  creating.value = true;
  try {
    const channel = await workspace.addChannel(
      channelName.value,
      channelTopic.value,
      channelPrivate.value ? 'private' : 'public',
    );
    dialog.value = null;
    channelName.value = '';
    channelTopic.value = '';
    channelPrivate.value = false;
    await select('channel', channel.id, 0);
    $q.notify({ message: 'Your new channel is ready.', color: 'primary', icon: 'tag' });
  } catch (error) {
    notifyError(error);
  } finally {
    creating.value = false;
  }
}
function dateLabel(value: string) {
  const date = new Date(value);
  if (date.toDateString() === new Date().toDateString()) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString()
    ? 'Yesterday'
    : date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}
function newDay(index: number) {
  return (
    index === 0 ||
    dateLabel(filteredMessages.value[index]!.createdAt) !==
      dateLabel(filteredMessages.value[index - 1]!.createdAt)
  );
}
function onScroll(info: {
  verticalSize: number;
  verticalPosition: number;
  verticalContainerSize: number;
}) {
  nearBottom.value = info.verticalSize - info.verticalPosition - info.verticalContainerSize < 150;
}
// Infinite scroll: QInfiniteScroll asks for the previous page when the user nears the top
// and keeps the scroll position stable once the page is rendered.
async function loadOlder(_index: number, done: (stop?: boolean) => void) {
  try {
    await chat.loadOlder();
  } catch (error) {
    notifyError(error);
  }
  done(!chat.hasMore);
}
// Jump to the newest message after opening a conversation and after sending; an incoming
// message only moves the view when the user is already reading the end of the conversation.
watch(
  () => [chat.messages.at(-1)?.id, chat.loading] as const,
  async ([lastId, loading], [previousId, wasLoading]) => {
    const opened = wasLoading && !loading;
    const own = lastId !== previousId && chat.messages.at(-1)?.userId === auth.user?.id;
    if (!opened && !own && !nearBottom.value) return;
    await nextTick();
    scroll.value?.setScrollPosition('vertical', 100000, opened ? 0 : 250);
  },
);
watch(
  () => [chat.replies.length, chat.threadLoading],
  async () => {
    await nextTick();
    threadScroll.value?.setScrollPosition('vertical', 100000, 200);
  },
);
onMounted(async () => {
  scrollTarget.value = scroll.value?.getScrollTarget();
  try {
    await workspace.load();
    await openFirst();
  } catch (error) {
    notifyError(error);
  }
});
</script>

<template>
  <q-layout view="hHh LpR fFf" class="workspace-layout">
    <q-header class="topbar">
      <q-toolbar class="global-toolbar">
        <div class="gather-brand">
          <q-icon name="blur_on" size="27px" /><span>gather<span class="brand-dot">.</span></span>
        </div>
        <div class="toolbar-right">
          <q-btn
            flat
            round
            dense
            icon="help_outline"
            aria-label="Help"
            @click="
              $q.dialog({
                title: 'Welcome to Gather',
                message:
                  'Choose a channel or teammate, send a message, add a reaction, or open a thread. Everything here runs on a friendly mock API.',
              })
            "
          />
        </div>
      </q-toolbar>
    </q-header>

    <aside class="workspace-rail">
      <q-btn
        unelevated
        class="workspace-avatar active"
        label="N"
        aria-label="Studio North workspace"
        @click="toggleSidebar"
        ><q-tooltip anchor="center right" self="center left">Studio North</q-tooltip></q-btn
      >
      <q-separator class="rail-separator" />
      <q-btn
        flat
        round
        icon="chat_bubble_outline"
        class="rail-chat"
        aria-label="Open conversations"
        @click="toggleSidebar"
        ><q-badge v-if="totalUnread" rounded floating color="primary" /><q-tooltip
          anchor="center right"
          self="center left"
          >Conversations</q-tooltip
        ></q-btn
      >
      <div class="rail-bottom">
        <q-btn
          flat
          round
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          aria-label="Toggle color theme"
          @click="toggleTheme"
          ><q-tooltip>Switch theme</q-tooltip></q-btn
        ><q-btn flat round aria-label="Your profile"
          ><q-avatar size="36px"><img :src="auth.user?.avatar" :alt="auth.user?.nick" /></q-avatar
          ><span class="presence" :class="presenceClass(auth.user?.state)"></span
          ><q-menu
            ><q-list style="min-width: 210px"
              ><q-item
                ><q-item-section
                  ><b>{{ auth.user ? fullName(auth.user) : '' }}</b
                  ><small class="muted"
                    >@{{ auth.user?.nick }} · {{ auth.user?.email }}</small
                  ></q-item-section
                ></q-item
              ><q-separator /><q-item-label header>Set your status</q-item-label
              ><q-item
                v-for="state in states"
                :key="state"
                v-close-popup
                clickable
                :active="auth.user?.state === state"
                @click="updateSettings({ state })"
                ><q-item-section avatar
                  ><span
                    class="presence inline-presence"
                    :class="presenceClass(state)"
                  ></span></q-item-section
                ><q-item-section>{{ stateLabels[state] }}</q-item-section
                ><q-item-section v-if="auth.user?.state === state" side
                  ><q-icon name="check" size="16px" /></q-item-section></q-item
              ><q-separator /><q-item v-close-popup clickable @click="dialog = 'settings'"
                ><q-item-section>Preferences</q-item-section></q-item
              ><q-item v-close-popup clickable @click="logout"
                ><q-item-section>Sign out</q-item-section></q-item
              ></q-list
            ></q-menu
          ></q-btn
        >
      </div>
    </aside>

    <q-drawer
      v-model="drawer"
      :width="SIDEBAR_WIDTH"
      :mini="miniActive"
      :mini-width="MINI_WIDTH"
      :breakpoint="1023"
      show-if-above
      bordered
      class="channel-drawer"
    >
      <div v-if="miniActive" class="mini-sidebar">
        <q-btn
          flat
          round
          dense
          icon="keyboard_double_arrow_right"
          class="mini-expand"
          aria-label="Expand the sidebar"
          @click="toggleSidebar"
          ><q-tooltip anchor="center right" self="center left">Expand</q-tooltip></q-btn
        >
        <q-scroll-area class="mini-scroll">
          <div class="mini-list">
            <template v-for="(item, index) in miniItems" :key="item.key"
              ><q-separator
                v-if="index && item.group !== miniItems[index - 1]?.group"
                class="mini-separator"
              /><q-btn
                flat
                round
                class="mini-item"
                :class="{
                  active: item.group !== 'invites' && chat.activeId === item.id,
                  invited: item.group === 'invites',
                }"
                :aria-label="item.label"
                @click="openMini(item)"
                ><q-avatar size="40px" :class="{ 'mini-channel': !item.avatar }"
                  ><img v-if="item.avatar" :src="item.avatar" alt="" /><template v-else>{{
                    item.letter
                  }}</template></q-avatar
                ><q-badge
                  v-if="item.unread"
                  floating
                  rounded
                  color="primary"
                  :label="item.unread"
                /><q-tooltip anchor="center right" self="center left">{{
                  item.label
                }}</q-tooltip></q-btn
              ></template
            >
          </div>
        </q-scroll-area>
      </div>
      <template v-else>
        <div class="sidebar-heading">
          <q-btn
            v-if="$q.screen.gt.sm"
            flat
            round
            dense
            icon="keyboard_double_arrow_left"
            class="sidebar-collapse"
            aria-label="Collapse the sidebar"
            @click="toggleSidebar"
            ><q-tooltip>Collapse</q-tooltip></q-btn
          >
          <q-btn
            flat
            no-caps
            class="workspace-title"
            icon-right="keyboard_arrow_down"
            :label="workspace.workspace?.name ?? 'Studio North'"
            ><q-menu
              ><q-list style="min-width: 210px"
                ><q-item v-close-popup clickable @click="dialog = 'settings'"
                  ><q-item-section avatar><q-icon name="settings" /></q-item-section
                  ><q-item-section>Workspace settings</q-item-section></q-item
                ><q-item v-close-popup clickable @click="toggleTheme"
                  ><q-item-section avatar
                    ><q-icon
                      :name="$q.dark.isActive ? 'light_mode' : 'dark_mode'" /></q-item-section
                  ><q-item-section>Toggle theme</q-item-section></q-item
                ><q-separator /><q-item v-close-popup clickable @click="logout"
                  ><q-item-section avatar><q-icon name="logout" /></q-item-section
                  ><q-item-section>Sign out</q-item-section></q-item
                ></q-list
              ></q-menu
            ></q-btn
          >
          <div class="workspace-status">
            <span class="status-dot"></span
            >{{ workspace.members.filter((m) => m.state === 'Online').length }} members online
          </div>
        </div>
        <q-input
          v-model="sidebarSearch"
          outlined
          dense
          placeholder="Find a conversation"
          class="sidebar-search"
          aria-label="Filter channels and direct messages"
          ><template #prepend><q-icon name="search" size="18px" /></template
          ><template v-if="sidebarSearch" #append
            ><q-icon name="close" class="cursor-pointer" @click="sidebarSearch = ''" /></template
        ></q-input>
        <q-scroll-area class="sidebar-scroll">
          <q-list class="sidebar-shortcuts"
            ><q-item clickable @click="openDigest('threads')"
              ><q-item-section avatar><q-icon name="forum" size="19px" /></q-item-section
              ><q-item-section>Threads</q-item-section></q-item
            ><q-item clickable @click="openDigest('saved')"
              ><q-item-section avatar><q-icon name="bookmark_border" size="19px" /></q-item-section
              ><q-item-section>Saved for later</q-item-section
              ><q-item-section v-if="workspace.savedIds.length" side
                ><q-badge :label="workspace.savedIds.length" rounded /></q-item-section></q-item
          ></q-list>
          <q-separator class="sidebar-divider" />
          <template v-if="favoriteChannels.length || favoriteDms.length"
            ><div class="section-heading">
              <q-btn
                flat
                dense
                no-caps
                :icon="favoritesOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_right'"
                label="Favorites"
                @click="favoritesOpen = !favoritesOpen"
              />
            </div>
            <template v-if="favoritesOpen"
              ><q-list class="channel-list"
                ><ChannelListItem
                  v-for="channel in favoriteChannels"
                  :key="channel.id"
                  :channel="channel"
                  :active="chat.kind === 'channel' && chat.activeId === channel.id"
                  :is-admin="channel.owner === auth.user?.id"
                  @select="select('channel', channel.id, channel.unreadCount)"
                  @favorite="toggleFavorite('channel', channel.id)"
                  @leave="confirmLeave(channel)"
                  @close="confirmClose(channel)" /></q-list
              ><q-list class="dm-list favorite-dms"
                ><DmListItem
                  v-for="dm in favoriteDms"
                  :key="dm.id"
                  :dm="dm"
                  :active="chat.kind === 'dm' && chat.activeId === dm.id"
                  @select="select('dm', dm.id, dm.unreadCount)" /></q-list></template
          ></template>
          <div class="section-heading">
            <q-btn
              flat
              dense
              no-caps
              :icon="channelsOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_right'"
              label="Channels"
              @click="channelsOpen = !channelsOpen"
            /><q-btn
              flat
              round
              dense
              size="sm"
              icon="add"
              aria-label="Create channel"
              @click="dialog = 'channel'"
            />
          </div>
          <template v-if="workspace.loading"
            ><q-skeleton v-for="n in 6" :key="n" type="text" class="q-mx-md q-my-sm"
          /></template>
          <q-list v-else-if="channelsOpen" class="channel-list"
            ><q-item v-for="invite in filteredInvites" :key="invite.id" class="invited"
              ><q-item-section avatar
                ><q-icon v-if="invite.channel.type === 'private'" name="lock" size="15px" /><span
                  v-else
                  class="hash"
                  >#</span
                ></q-item-section
              ><q-item-section
                ><q-item-label>{{ invite.channel.name }}</q-item-label
                ><q-item-label caption
                  >Invited by @{{ invite.inviter.nick }}</q-item-label
                ></q-item-section
              ><q-item-section side
                ><div class="row no-wrap">
                  <q-btn
                    flat
                    round
                    dense
                    size="sm"
                    icon="check"
                    :aria-label="`Accept invitation to ${invite.channel.name}`"
                    @click="acceptInvite(invite)"
                    ><q-tooltip>Join channel</q-tooltip></q-btn
                  ><q-btn
                    flat
                    round
                    dense
                    size="sm"
                    icon="close"
                    :aria-label="`Decline invitation to ${invite.channel.name}`"
                    @click="declineInvite(invite)"
                    ><q-tooltip>Decline</q-tooltip></q-btn
                  >
                </div></q-item-section
              ></q-item
            ><ChannelListItem
              v-for="channel in otherChannels"
              :key="channel.id"
              :channel="channel"
              :active="chat.kind === 'channel' && chat.activeId === channel.id"
              :is-admin="channel.owner === auth.user?.id"
              @select="select('channel', channel.id, channel.unreadCount)"
              @favorite="toggleFavorite('channel', channel.id)"
              @leave="confirmLeave(channel)"
              @close="confirmClose(channel)"
            /><q-item v-if="!filteredChannels.length && !filteredInvites.length"
              ><q-item-section class="muted">No channels found</q-item-section></q-item
            ></q-list
          >
          <div class="section-heading dm-heading">
            <q-btn
              flat
              dense
              no-caps
              :icon="dmsOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_right'"
              label="Direct messages"
              @click="dmsOpen = !dmsOpen"
            /><q-btn
              flat
              round
              dense
              size="sm"
              icon="add"
              aria-label="New message"
              @click="openPeople"
              ><q-tooltip>New message</q-tooltip></q-btn
            >
          </div>
          <q-list v-if="dmsOpen" class="dm-list"
            ><DmListItem
              v-for="dm in otherDms"
              :key="dm.id"
              :dm="dm"
              :active="chat.kind === 'dm' && chat.activeId === dm.id"
              @select="select('dm', dm.id, dm.unreadCount)"
            /><q-item v-if="!filteredDms.length && !workspace.loading"
              ><q-item-section class="muted">No conversations yet</q-item-section></q-item
            ></q-list
          >
        </q-scroll-area>
      </template>
    </q-drawer>

    <q-page-container
      class="chat-page-container"
      :style="{ '--sidebar-width': `${sidebarWidth}px` }"
      ><q-page
        class="chat-page"
        :style-fn="() => ({ height: 'calc(100dvh - 56px)', minHeight: '0' })"
      >
        <q-toolbar class="channel-header"
          ><q-btn
            flat
            round
            dense
            icon="menu"
            class="mobile-menu"
            aria-label="Open sidebar"
            @click="toggleSidebar"
          />
          <div class="channel-identity">
            <div class="channel-name">
              <q-icon
                v-if="activeChannel?.type === 'private'"
                name="lock"
                size="19px"
                class="header-lock"
              /><span v-else-if="chat.kind === 'channel'" class="header-hash">#</span
              ><q-avatar v-else size="29px"
                ><img :src="activeDm?.user.avatar" :alt="title"
              /></q-avatar>
              <h1>{{ title }}</h1>
              <q-btn
                flat
                round
                dense
                size="sm"
                :icon="currentConversation?.favorite ? 'star' : 'star_border'"
                :class="{ 'is-favorite': currentConversation?.favorite }"
                :aria-label="
                  currentConversation?.favorite ? 'Remove from favorites' : 'Add to favorites'
                "
                @click="toggleFavorite(chat.kind, chat.activeId)"
                ><q-tooltip>{{
                  currentConversation?.favorite ? 'Remove from favorites' : 'Add to favorites'
                }}</q-tooltip></q-btn
              >
            </div>
            <p>{{ topic }}</p>
          </div>
          <q-space /><template v-if="chat.kind === 'channel'"
            ><q-btn
              flat
              no-caps
              class="member-button"
              aria-label="View channel members"
              @click="dialog = 'members'"
              ><div class="header-avatars">
                <img v-for="user in headerAvatars" :key="user.id" :src="user.avatar" alt="" />
              </div>
              <span>{{ chat.members.length }}</span></q-btn
            ><q-separator vertical inset class="header-separator" /></template
          ><q-btn
            flat
            round
            dense
            icon="search"
            aria-label="Search messages"
            @click="
              showSearch = !showSearch;
              messageSearch = '';
            "
            ><q-tooltip>Search this conversation</q-tooltip></q-btn
          ><q-btn
            flat
            round
            dense
            icon="info_outline"
            aria-label="Conversation details"
            @click="dialog = 'info'"
            ><q-tooltip>Conversation details</q-tooltip></q-btn
          ></q-toolbar
        >
        <q-input
          v-if="showSearch"
          v-model="messageSearch"
          outlined
          dense
          autofocus
          clearable
          placeholder="Search messages in this conversation…"
          class="message-search"
          @clear="messageSearch = ''"
          ><template #prepend><q-icon name="search" /></template
        ></q-input>
        <q-splitter
          v-model="split"
          :disable="!chat.parent || mobileThread"
          :limits="[45, 78]"
          :class="{ 'has-thread': chat.parent && !mobileThread }"
          class="conversation-splitter"
          :style="{ '--split-width': chat.parent && !mobileThread ? `${split}%` : '100%' }"
        >
          <template #before
            ><div class="conversation-pane">
              <q-scroll-area ref="scroll" class="message-scroll" @scroll="onScroll">
                <div v-if="chat.loading || !chat.hasMore" class="conversation-welcome">
                  <div class="welcome-symbol">{{ chat.kind === 'channel' ? '#' : '👋' }}</div>
                  <div>
                    <div class="welcome-eyebrow">
                      {{
                        chat.kind === 'channel'
                          ? 'THE CONVERSATION STARTS HERE'
                          : 'A LITTLE MORE PERSONAL'
                      }}
                    </div>
                    <h2>
                      {{
                        chat.kind === 'channel'
                          ? `Welcome to #${title}`
                          : `You and ${activeDm?.user.name}`
                      }}<span> ✨</span>
                    </h2>
                    <p>
                      {{
                        chat.kind === 'channel'
                          ? 'Updates, little wins, and everything in between. You’re in good company.'
                          : 'Just the two of you. Say hello, share an idea, or catch up over coffee.'
                      }}
                    </p>
                  </div>
                </div>
                <div v-if="chat.loading" class="message-skeletons">
                  <div v-for="n in 7" :key="n" class="row no-wrap q-pa-md q-gutter-md">
                    <q-skeleton type="QAvatar" size="38px" />
                    <div class="col">
                      <q-skeleton type="text" width="35%" /><q-skeleton
                        type="text"
                        width="85%"
                      /><q-skeleton v-if="n % 2" type="text" width="55%" />
                    </div>
                  </div>
                </div>
                <q-infinite-scroll
                  v-else
                  :key="chat.activeId"
                  reverse
                  :offset="250"
                  :scroll-target="scrollTarget"
                  :disable="!!messageSearch"
                  @load="loadOlder"
                  ><template #loading
                    ><div class="row justify-center q-py-md">
                      <q-spinner-dots color="primary" size="30px" /></div></template
                  ><template v-for="(message, index) in filteredMessages" :key="message.id"
                    ><div v-if="newDay(index)" class="day-divider">
                      <q-separator /><span>{{ dateLabel(message.createdAt) }}</span
                      ><q-separator />
                    </div>
                    <div
                      v-if="
                        !messageSearch &&
                        chat.unreadCount &&
                        index === chat.messages.length - chat.unreadCount
                      "
                      class="unread-divider"
                    >
                      <q-separator /><span>New messages</span><q-separator />
                    </div>
                    <ChatMessage :message="message"
                  /></template>
                  <div v-if="!filteredMessages.length" class="empty-state">
                    <q-icon :name="messageSearch ? 'search_off' : 'forum'" size="44px" />
                    <h3>{{ messageSearch ? 'No messages found' : 'A fresh start' }}</h3>
                    <p>
                      {{
                        messageSearch
                          ? 'Try another word or phrase.'
                          : 'Be the first to say something good.'
                      }}
                    </p>
                  </div></q-infinite-scroll
                >
              </q-scroll-area>
              <div class="composer-wrap">
                <TypingIndicator />
                <MessageComposer
                  ref="composer"
                  :users="mentionCandidates"
                  :commands="COMMANDS"
                  :command-users="commandUsers"
                  :placeholder="
                    chat.kind === 'channel'
                      ? `Message #${title} or type a /command`
                      : `Message ${activeDm?.user.name}`
                  "
                  :loading="chat.sending || chat.loading || runningCommand"
                  @send="send"
                />
              </div></div
          ></template>
          <template #after
            ><div v-if="chat.parent && !mobileThread" class="thread-pane">
              <div class="thread-header">
                <div>
                  <h2>Thread</h2>
                  <span>#{{ title }}</span>
                </div>
                <q-btn
                  flat
                  round
                  dense
                  icon="close"
                  aria-label="Close thread"
                  @click="chat.closeThread"
                />
              </div>
              <q-scroll-area ref="threadScroll" class="thread-scroll"
                ><ChatMessage :message="chat.parent" in-thread />
                <div class="thread-reply-divider">
                  <span>{{ chat.parent.replyCount }} replies</span><q-separator />
                </div>
                <q-skeleton
                  v-if="chat.threadLoading"
                  type="text"
                  height="160px"
                  class="q-ma-md"
                /><ChatMessage
                  v-for="reply in chat.replies"
                  :key="reply.id"
                  :message="reply"
                  in-thread
                />
                <div v-if="!chat.threadLoading && !chat.replies.length" class="empty-state">
                  <q-icon name="chat_bubble_outline" size="30px" />
                  <p>Start the conversation.</p>
                </div></q-scroll-area
              >
              <div class="thread-composer">
                <MessageComposer
                  ref="replyComposer"
                  :users="mentionCandidates"
                  placeholder="Reply in thread…"
                  compact
                  :loading="chat.sending"
                  @send="(text) => send(text, true)"
                /><small class="muted">Keep the conversation going, without the noise.</small>
              </div>
            </div></template
          >
        </q-splitter>
      </q-page></q-page-container
    >

    <q-drawer
      v-if="mobileThread"
      v-model="threadOpen"
      side="right"
      overlay
      bordered
      :width="Math.min(360, $q.screen.width)"
      class="mobile-thread-drawer"
      ><div v-if="chat.parent" class="thread-pane">
        <div class="thread-header">
          <div>
            <h2>Thread</h2>
            <span>{{ title }}</span>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            aria-label="Close thread"
            @click="chat.closeThread"
          />
        </div>
        <q-scroll-area ref="threadScroll" class="thread-scroll"
          ><ChatMessage :message="chat.parent" in-thread />
          <div class="thread-reply-divider">
            <span>{{ chat.parent.replyCount }} replies</span><q-separator />
          </div>
          <q-skeleton
            v-if="chat.threadLoading"
            type="text"
            height="160px"
            class="q-ma-md"
          /><ChatMessage v-for="reply in chat.replies" :key="reply.id" :message="reply" in-thread />
          <div v-if="!chat.threadLoading && !chat.replies.length" class="empty-state">
            <p>Be the first to reply.</p>
          </div></q-scroll-area
        >
        <div class="thread-composer">
          <MessageComposer
            ref="replyComposer"
            :users="mentionCandidates"
            placeholder="Reply in thread…"
            compact
            :loading="chat.sending"
            @send="(text) => send(text, true)"
          />
        </div></div
    ></q-drawer>

    <q-dialog :model-value="!!dialog" @update:model-value="dialog = null"
      ><q-card class="detail-dialog"
        ><q-card-section class="row items-center"
          ><h2>
            {{
              dialog === 'channel'
                ? 'A new place to connect'
                : dialog === 'members'
                  ? `Members of #${title}`
                  : dialog === 'people'
                    ? 'New message'
                    : dialog === 'settings'
                      ? 'Make it yours'
                      : dialog === 'saved'
                        ? 'Saved for later'
                        : dialog === 'threads'
                          ? 'Threads'
                          : `About ${chat.kind === 'channel' ? '#' : ''}${title}`
            }}
          </h2>
          <q-space /><q-btn
            v-close-popup
            flat
            round
            dense
            icon="close"
            aria-label="Close dialog" /></q-card-section
        ><q-separator /><q-card-section>
          <q-form v-if="dialog === 'channel'" @submit="addChannel"
            ><p class="muted">Give your next big idea a little room to grow.</p>
            <q-input
              v-model="channelName"
              outlined
              label="Channel name"
              prefix="#"
              :rules="[(v) => !!v.trim() || 'A name is required']" /><q-input
              v-model="channelTopic"
              outlined
              label="Topic (optional)" /><q-toggle
              v-model="channelPrivate"
              label="Private channel — only people you invite can join"
              class="q-my-md" /><br /><q-btn
              unelevated
              color="primary"
              no-caps
              label="Create channel"
              type="submit"
              :loading="creating"
          /></q-form>
          <div v-else-if="dialog === 'members' || dialog === 'people'">
            <q-input
              v-if="dialog === 'people'"
              v-model="peopleSearch"
              outlined
              dense
              autofocus
              placeholder="Search by name or nickname"
              class="q-mb-sm"
              ><template #prepend><q-icon name="search" size="18px" /></template
            ></q-input>
            <q-list
              ><q-item
                v-for="member in listedMembers"
                :key="member.id"
                :clickable="member.id !== auth.user?.id"
                @click="member.id !== auth.user?.id && messageUser(member.id)"
                ><q-item-section avatar
                  ><q-avatar size="38px"
                    ><img :src="member.avatar" :alt="fullName(member)" /></q-avatar></q-item-section
                ><q-item-section
                  ><b>{{ fullName(member) }}</b
                  ><small class="muted"
                    >@{{ member.nick }}
                    <span v-if="dialog === 'members' && member.id === activeChannel?.owner"
                      >· admin</span
                    ></small
                  ></q-item-section
                ><q-item-section side
                  ><div class="row items-center no-wrap q-gutter-x-sm">
                    <small class="muted">{{ stateLabels[member.state] }}</small
                    ><span
                      class="presence inline-presence"
                      :class="presenceClass(member.state)"
                    ></span></div></q-item-section></q-item
            ></q-list>
          </div>
          <MessageDigest
            v-else-if="dialog === 'saved' || dialog === 'threads'"
            :items="digestItems"
            :loading="digestLoading"
            :removable="dialog === 'saved'"
            :empty-text="
              dialog === 'saved'
                ? 'Nothing saved yet. Use the bookmark on a message to keep it here.'
                : 'No threads yet. Reply to a message to start one.'
            "
            @open="openRef"
            @remove="removeSaved"
          />
          <div v-else-if="dialog === 'settings'">
            <p class="muted">{{ workspace.workspace?.description }}</p>
            <q-item
              ><q-item-section
                ><b>Status</b
                ><small class="muted"
                  >Offline pauses incoming messages until you are back online.</small
                ><q-btn-toggle
                  :model-value="auth.user?.state"
                  :options="stateOptions"
                  no-caps
                  unelevated
                  spread
                  toggle-color="primary"
                  class="status-toggle"
                  @update:model-value="
                    (state: UserState) => updateSettings({ state })
                  " /></q-item-section
            ></q-item>
            <q-item
              ><q-item-section
                ><b>Appearance</b
                ><small class="muted">A comfortable space, day or night.</small></q-item-section
              ><q-item-section side
                ><q-toggle
                  :model-value="$q.dark.isActive"
                  checked-icon="dark_mode"
                  unchecked-icon="light_mode"
                  @update:model-value="toggleTheme" /></q-item-section></q-item
            ><q-item
              ><q-item-section
                ><b>Notify me about mentions only</b
                ><small class="muted"
                  >Skip notifications for messages that do not @mention you.</small
                ></q-item-section
              ><q-item-section side
                ><q-toggle
                  :model-value="auth.user?.mentionOnlyNotif ?? false"
                  @update:model-value="
                    (value: boolean) => updateSettings({ mentionOnlyNotif: value })
                  " /></q-item-section></q-item
            ><q-item
              ><q-item-section
                ><b>Browser notifications</b
                ><small class="muted"
                  >Shown for new messages while Gather is in the background. Paused in Do not
                  disturb.</small
                ></q-item-section
              ><q-item-section side
                ><q-btn
                  v-if="permission === 'default'"
                  outline
                  dense
                  no-caps
                  color="primary"
                  label="Enable"
                  @click="enableNotifications"
                /><small v-else class="muted">{{
                  permission === 'granted'
                    ? 'Enabled'
                    : permission === 'denied'
                      ? 'Blocked in browser'
                      : 'Not supported'
                }}</small></q-item-section
              ></q-item
            ><q-separator class="q-my-md" />
            <p>
              <b>{{ auth.user ? fullName(auth.user) : '' }}</b
              ><br /><span class="muted">{{ auth.user?.email }}</span>
            </p>
            <q-btn
              outline
              no-caps
              color="primary"
              label="Sign out"
              @click="
                dialog = null;
                logout();
              "
            />
          </div>
          <div v-else>
            <div class="info-label">TOPIC</div>
            <p>{{ topic }}</p>
            <template v-if="activeChannel"
              ><div class="info-label">CHANNEL</div>
              <p>
                {{ activeChannel.type === 'private' ? 'Private' : 'Public' }} channel · admin @{{
                  channelAdmin?.nick
                }}<br /><span class="muted"
                  >A channel with no new messages for 30 days is closed automatically.</span
                >
              </p></template
            >
            <div class="info-label">A LITTLE ABOUT THIS SPACE</div>
            <p class="muted">
              A place for thoughtful conversations, shared ideas, and the little things that bring
              us together.
            </p>
            <q-btn
              v-if="activeChannel"
              flat
              no-caps
              color="primary"
              icon="people_outline"
              :label="`${chat.members.length} members`"
              @click="dialog = 'members'"
            />
          </div> </q-card-section></q-card
    ></q-dialog>
  </q-layout>
</template>
