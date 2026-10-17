<script setup lang="ts">
import type { Channel } from '@/types';

// One channel in the sidebar. Used both in Favorites and in Channels.
defineProps<{ channel: Channel; active: boolean; isAdmin: boolean }>();
const emit = defineEmits<{ select: []; leave: []; close: []; favorite: [] }>();
</script>

<template>
  <q-item
    clickable
    :active="active"
    :class="{ 'has-unread': channel.unreadCount }"
    @click="emit('select')"
    ><q-item-section avatar
      ><q-icon v-if="channel.type === 'private'" name="lock" size="15px" /><span v-else class="hash"
        >#</span
      ></q-item-section
    ><q-item-section>{{ channel.name }}</q-item-section
    ><q-item-section v-if="channel.unreadCount" side
      ><q-badge :label="channel.unreadCount" rounded /></q-item-section
    ><q-item-section v-else-if="active" side
      ><span class="active-channel-dot"></span></q-item-section
    ><q-item-section side class="channel-menu"
      ><q-btn
        flat
        round
        dense
        size="xs"
        icon="more_horiz"
        :aria-label="`Actions for ${channel.name}`"
        @click.stop
        ><q-menu
          ><q-list dense style="min-width: 190px"
            ><q-item v-close-popup clickable @click="emit('favorite')"
              ><q-item-section avatar
                ><q-icon
                  :name="channel.favorite ? 'star' : 'star_border'"
                  size="17px" /></q-item-section
              ><q-item-section>{{
                channel.favorite ? 'Remove from favorites' : 'Add to favorites'
              }}</q-item-section></q-item
            ><q-item v-close-popup clickable @click="emit('leave')"
              ><q-item-section avatar><q-icon name="logout" size="17px" /></q-item-section
              ><q-item-section>Leave channel</q-item-section></q-item
            ><q-item v-if="isAdmin" v-close-popup clickable @click="emit('close')"
              ><q-item-section avatar><q-icon name="delete_outline" size="17px" /></q-item-section
              ><q-item-section>Close channel</q-item-section></q-item
            ></q-list
          ></q-menu
        ></q-btn
      ></q-item-section
    ></q-item
  >
</template>
