import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '@/services/api';
import type { Channel, ChannelInvite, ChannelType, Dm, MessageRef, User, Workspace } from '@/types';

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspace = ref<Workspace | null>(null);
  // Channels the signed-in user is a member of.
  const channels = ref<Channel[]>([]);
  // Pending invitations; the sidebar pins them above the channels.
  const invites = ref<ChannelInvite[]>([]);
  const dms = ref<Dm[]>([]);
  // Everyone in the workspace; used to resolve message authors and nicknames.
  const members = ref<User[]>([]);
  // Ids of the messages the user saved for later.
  const savedIds = ref<string[]>([]);
  const loading = ref(false);

  async function load() {
    loading.value = true;
    try {
      const [w, c, i, d, m, s] = await Promise.all([
        api.getWorkspace(),
        api.listChannels(),
        api.listInvites(),
        api.listDms(),
        api.listUsers(),
        api.listSaved(),
      ]);
      savedIds.value = s.map((ref) => ref.message.id);
      workspace.value = w;
      channels.value = c;
      invites.value = i;
      dms.value = d;
      members.value = m;
    } finally {
      loading.value = false;
    }
  }

  function addToList(channel: Channel) {
    if (!channels.value.some((c) => c.id === channel.id)) channels.value.push(channel);
    invites.value = invites.value.filter((invite) => invite.channel.id !== channel.id);
  }
  function removeFromList(channelId: string) {
    channels.value = channels.value.filter((c) => c.id !== channelId);
  }

  async function addChannel(name: string, topic: string, type: ChannelType) {
    const channel = await api.createChannel(name, topic, type);
    addToList(channel);
    return channel;
  }

  async function join(name: string, isPrivate: boolean) {
    const result = await api.joinChannel(name, isPrivate);
    addToList(result.channel);
    return result;
  }

  async function leave(channelId: string) {
    const result = await api.leaveChannel(channelId);
    removeFromList(channelId);
    return result;
  }

  async function close(channelId: string) {
    await api.deleteChannel(channelId);
    removeFromList(channelId);
  }

  async function acceptInvite(inviteId: string) {
    const channel = await api.acceptInvite(inviteId);
    addToList(channel);
    return channel;
  }

  async function declineInvite(inviteId: string) {
    await api.declineInvite(inviteId);
    invites.value = invites.value.filter((invite) => invite.id !== inviteId);
  }

  // Keeps the copy of a user in the directory in step with their profile.
  function syncMember(user: User) {
    const index = members.value.findIndex((member) => member.id === user.id);
    if (index >= 0) members.value[index] = user;
  }

  function find(kind: 'channel' | 'dm', id: string) {
    return (kind === 'channel' ? channels.value : dms.value).find((item) => item.id === id);
  }

  async function toggleFavorite(kind: 'channel' | 'dm', id: string) {
    const favorite = await api.toggleFavorite(id);
    const item = find(kind, id);
    if (item) item.favorite = favorite;
  }

  // Opens (or starts) the direct message with someone and keeps the sidebar list in step.
  async function openDirectMessage(userId: string) {
    const dm = await api.openDirectMessage(userId);
    if (!dms.value.some((item) => item.id === dm.id)) dms.value.push(dm);
    return dm;
  }

  const isSaved = (messageId: string) => savedIds.value.includes(messageId);

  async function toggleSaved(messageId: string) {
    const saved = await api.toggleSaved(messageId);
    savedIds.value = saved
      ? [...savedIds.value, messageId]
      : savedIds.value.filter((id) => id !== messageId);
    return saved;
  }

  async function loadSaved(): Promise<MessageRef[]> {
    const refs = await api.listSaved();
    savedIds.value = refs.map((ref) => ref.message.id);
    return refs;
  }

  function loadThreads() {
    return api.listThreads();
  }

  function markRead(kind: 'channel' | 'dm', id: string) {
    const item = find(kind, id);
    if (item) item.unreadCount = 0;
    void api.markRead(id).catch(() => undefined);
  }

  function addUnread(kind: 'channel' | 'dm', id: string) {
    const item = find(kind, id);
    if (item) item.unreadCount++;
  }

  return {
    workspace,
    channels,
    invites,
    dms,
    members,
    loading,
    load,
    addChannel,
    join,
    leave,
    close,
    acceptInvite,
    declineInvite,
    syncMember,
    markRead,
    addUnread,
    savedIds,
    toggleFavorite,
    openDirectMessage,
    isSaved,
    toggleSaved,
    loadSaved,
    loadThreads,
  };
});
