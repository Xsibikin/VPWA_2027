<script setup lang="ts">
import { inject } from 'vue';
import { directMessagesKey } from '@/injectionKeys';
import type { User } from '@/types';
import { fullName, presenceClass, stateLabels } from '@/utils/user';

// Small profile shown in a popup when someone clicks a user's avatar, name or @mention.
defineProps<{ user: User }>();
// Provided by ChatPage; missing (null) anywhere else, then the button is simply not shown.
const directMessages = inject(directMessagesKey, null);
</script>

<template>
  <div class="profile-card">
    <q-avatar size="64px" class="profile-avatar"
      ><img :src="user.avatar" :alt="fullName(user)"
    /></q-avatar>
    <div class="profile-name">{{ fullName(user) }}</div>
    <div class="profile-nick">@{{ user.nick }}</div>
    <div class="profile-state">
      <span class="presence inline-presence" :class="presenceClass(user.state)"></span
      >{{ stateLabels[user.state] }}
    </div>
    <div class="profile-email muted">{{ user.email }}</div>
    <q-btn
      v-if="directMessages?.canMessage(user.id)"
      v-close-popup
      unelevated
      no-caps
      color="primary"
      icon="chat_bubble_outline"
      label="Message"
      class="profile-message"
      @click="directMessages.open(user.id)"
    />
  </div>
</template>
