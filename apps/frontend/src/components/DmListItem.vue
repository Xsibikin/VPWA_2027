<script setup lang="ts">
import type { Dm } from '@/types';
import { fullName, presenceClass } from '@/utils/user';

// One direct message in the sidebar. Used both in Favorites and in Direct messages.
defineProps<{ dm: Dm; active: boolean }>();
const emit = defineEmits<{ select: [] }>();
</script>

<template>
  <q-item
    clickable
    :active="active"
    :class="{ 'has-unread': dm.unreadCount }"
    @click="emit('select')"
    ><q-item-section avatar
      ><div class="dm-avatar">
        <q-avatar size="25px"><img :src="dm.user.avatar" :alt="fullName(dm.user)" /></q-avatar
        ><span class="presence" :class="presenceClass(dm.user.state)"></span></div></q-item-section
    ><q-item-section>{{ fullName(dm.user) }}</q-item-section
    ><q-item-section v-if="dm.unreadCount" side
      ><q-badge :label="dm.unreadCount" rounded /></q-item-section
    ><q-item-section v-else-if="dm.user.state === 'DND'" side
      ><q-icon name="dark_mode" size="12px" /></q-item-section
  ></q-item>
</template>
