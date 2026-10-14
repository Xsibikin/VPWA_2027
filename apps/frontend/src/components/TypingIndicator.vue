<script setup lang="ts">
import { computed } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useWorkspaceStore } from '@/stores/workspace';
import type { User } from '@/types';

const chat = useChatStore();
const workspace = useWorkspaceStore();
const typists = computed(() =>
  Object.keys(chat.typing).flatMap((id): User[] => {
    const user = workspace.members.find((member) => member.id === id);
    return user ? [user] : [];
  }),
);
</script>

<template>
  <div class="typing-indicator" aria-live="polite">
    <template v-if="typists.length">
      <span class="typing-dots"><i></i><i></i><i></i></span>
      <span>
        <template v-for="(user, index) in typists" :key="user.id"
          ><template v-if="index">, </template
          ><q-btn
            flat
            dense
            no-caps
            class="typing-name"
            :label="user.nick"
            :aria-label="`See what ${user.nick} is typing`"
            ><q-tooltip>See what {{ user.nick }} is typing</q-tooltip
            ><q-menu anchor="top left" self="bottom left" :offset="[0, 6]" class="typing-draft"
              ><div class="info-label">@{{ user.nick }} IS WRITING</div>
              <p>{{ chat.typing[user.id] }}</p></q-menu
            ></q-btn
          ></template
        >
        {{ typists.length > 1 ? 'are' : 'is' }} typing
      </span>
    </template>
  </div>
</template>
