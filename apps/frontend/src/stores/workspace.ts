import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '@/services/api';
import type { Channel, Dm, User, Workspace } from '@/types';

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspace = ref<Workspace | null>(null);
  const channels = ref<Channel[]>([]);
  const dms = ref<Dm[]>([]);
  const members = ref<User[]>([]);
  const loading = ref(false);

  async function load() {
    loading.value = true;
    try {
      const [w, c, d, m] = await Promise.all([
        api.getWorkspace(),
        api.listChannels(),
        api.listDms(),
        api.listMembers('general'),
      ]);
      workspace.value = w;
      channels.value = c;
      dms.value = d;
      members.value = m;
    } finally {
      loading.value = false;
    }
  }

  async function addChannel(name: string, topic: string) {
    const channel = await api.createChannel(name, topic);
    channels.value.push(channel);
    return channel;
  }

  function markRead(kind: 'channel' | 'dm', id: string) {
    const item = (kind === 'channel' ? channels.value : dms.value).find((item) => item.id === id);
    if (item) item.unreadCount = 0;
  }

  return { workspace, channels, dms, members, loading, load, addChannel, markRead };
});
