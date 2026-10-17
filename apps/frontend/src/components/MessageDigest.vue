<script setup lang="ts">
import { useWorkspaceStore } from '@/stores/workspace';
import type { MessageRef } from '@/types';
import { fullName } from '@/utils/user';

// A list of messages from different conversations: saved messages and the thread list.
defineProps<{ items: MessageRef[]; loading: boolean; emptyText: string; removable?: boolean }>();
const emit = defineEmits<{ open: [item: MessageRef]; remove: [item: MessageRef] }>();
const workspace = useWorkspaceStore();

const author = (item: MessageRef) =>
  workspace.members.find((user) => user.id === item.message.userId);
function place(item: MessageRef) {
  if (item.kind === 'channel') {
    const channel = workspace.channels.find((c) => c.id === item.conversationId);
    return channel ? `#${channel.name}` : 'channel';
  }
  const dm = workspace.dms.find((d) => d.id === item.conversationId);
  return dm ? fullName(dm.user) : 'direct message';
}
const when = (iso: string) =>
  new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
</script>

<template>
  <div v-if="loading">
    <q-skeleton v-for="n in 3" :key="n" type="text" height="56px" class="q-my-sm" />
  </div>
  <div v-else-if="!items.length" class="empty-state">
    <p>{{ emptyText }}</p>
  </div>
  <q-list v-else class="digest-list">
    <q-item
      v-for="item in items"
      :key="item.message.id"
      clickable
      class="digest-item"
      @click="emit('open', item)"
      ><q-item-section avatar top
        ><q-avatar size="34px" class="message-avatar"
          ><img v-if="author(item)" :src="author(item)!.avatar" alt="" /></q-avatar
      ></q-item-section>
      <q-item-section>
        <div class="digest-meta">
          <b>{{ author(item) ? fullName(author(item)!) : 'Team member' }}</b
          ><span>{{ place(item) }} · {{ when(item.message.createdAt) }}</span>
        </div>
        <div class="digest-text">{{ item.message.text }}</div>
        <div v-if="item.message.replyCount" class="digest-replies">
          {{ item.message.replyCount }} replies
        </div>
      </q-item-section>
      <q-item-section v-if="removable" side top
        ><q-btn
          flat
          round
          dense
          size="sm"
          icon="bookmark_remove"
          aria-label="Remove from saved"
          @click.stop="emit('remove', item)"
          ><q-tooltip>Remove from saved</q-tooltip></q-btn
        ></q-item-section
      >
    </q-item>
  </q-list>
</template>
