<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth';
import { useWorkspaceStore } from '@/stores/workspace';
import { useChatStore } from '@/stores/chat';
import type { Message } from '@/types';

const props = defineProps<{ message: Message; inThread?: boolean }>();
const auth = useAuthStore();
const workspace = useWorkspaceStore();
const chat = useChatStore();
const $q = useQuasar();
const saved = ref(false);
const author = computed(() =>
  props.message.userId === auth.user?.id
    ? auth.user
    : workspace.members.find((u) => u.id === props.message.userId),
);
const time = computed(() =>
  new Date(props.message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
);
const emojis = ['🙌', '💚', '👍', '🎉', '🚀', '👀'];
async function react(emoji: string) {
  try {
    await chat.react(props.message.id, emoji);
  } catch (error) {
    $q.notify({ type: 'negative', message: (error as Error).message });
  }
}
async function share() {
  try {
    await navigator.clipboard.writeText(`${author.value?.name}: ${props.message.text}`);
    $q.notify({ message: 'Message copied to clipboard.', icon: 'content_copy' });
  } catch {
    $q.notify({ message: 'Clipboard is unavailable in this browser.', type: 'negative' });
  }
}
function thread() {
  void chat
    .openThread(props.message)
    .catch((error) => $q.notify({ type: 'negative', message: (error as Error).message }));
}
</script>

<template>
  <article
    class="chat-message"
    :class="{ 'own-message': message.userId === auth.user?.id }"
    :id="`message-${message.id}`"
  >
    <q-avatar size="38px" class="message-avatar"
      ><img v-if="author" :src="author.avatar" :alt="author.name" /><span v-else>?</span></q-avatar
    >
    <div class="message-body">
      <div class="message-meta">
        <strong>{{ author?.name ?? 'Team member' }}</strong
        ><span v-if="message.userId === auth.user?.id" class="you-label">you</span
        ><time :datetime="message.createdAt">{{ time }}</time
        ><q-icon v-if="saved" name="bookmark" color="primary" size="13px" />
      </div>
      <div class="message-text">
        {{ message.text }} <span v-if="message.edited" class="edited">(edited)</span>
      </div>
      <div v-if="message.reactions.length" class="reactions">
        <q-btn
          v-for="reaction in message.reactions"
          :key="reaction.emoji"
          unelevated
          no-caps
          dense
          class="reaction"
          :class="{ selected: reaction.userIds.includes(auth.user?.id ?? '') }"
          :aria-label="`React with ${reaction.emoji}, ${reaction.userIds.length} reactions`"
          :aria-pressed="reaction.userIds.includes(auth.user?.id ?? '')"
          @click="react(reaction.emoji)"
          ><span>{{ reaction.emoji }}</span
          ><span>{{ reaction.userIds.length }}</span></q-btn
        >
        <q-btn flat dense round size="xs" icon="add_reaction" aria-label="Add reaction"
          ><q-menu
            ><div class="emoji-grid">
              <q-btn
                v-for="emoji in emojis"
                :key="emoji"
                v-close-popup
                flat
                :label="emoji"
                @click="react(emoji)"
              /></div></q-menu
        ></q-btn>
      </div>
      <q-btn
        v-if="message.replyCount && !inThread"
        flat
        no-caps
        dense
        class="thread-link"
        @click="thread"
        ><div class="tiny-avatars">
          <img
            v-for="member in workspace.members.slice(1, 4)"
            :key="member.id"
            :src="member.avatar"
            alt=""
          />
        </div>
        <b>{{ message.replyCount }} replies</b
        ><span>View thread <q-icon name="arrow_forward" size="12px" /></span
      ></q-btn>
    </div>
    <div class="message-actions">
      <q-btn flat round dense size="sm" icon="add_reaction" aria-label="React"
        ><q-tooltip>Add reaction</q-tooltip
        ><q-menu
          ><div class="emoji-grid">
            <q-btn
              v-for="emoji in emojis"
              :key="emoji"
              v-close-popup
              flat
              :label="emoji"
              @click="react(emoji)"
            /></div></q-menu
      ></q-btn>
      <q-btn
        v-if="!inThread"
        flat
        round
        dense
        size="sm"
        icon="chat_bubble_outline"
        aria-label="Reply in thread"
        @click="thread"
        ><q-tooltip>Reply in thread</q-tooltip></q-btn
      >
      <q-btn flat round dense size="sm" icon="reply" aria-label="Share message" @click="share"
        ><q-tooltip>Copy message</q-tooltip></q-btn
      >
      <q-btn
        flat
        round
        dense
        size="sm"
        :icon="saved ? 'bookmark' : 'bookmark_border'"
        aria-label="Save message"
        @click="
          saved = !saved;
          $q.notify(saved ? 'Message saved for later.' : 'Message removed from saved.');
        "
        ><q-tooltip>Save for later</q-tooltip></q-btn
      >
      <q-btn flat round dense size="sm" icon="more_horiz" aria-label="More message actions"
        ><q-menu
          ><q-list dense
            ><q-item v-close-popup clickable @click="share"
              ><q-item-section>Copy message</q-item-section></q-item
            ><q-item
              v-close-popup
              clickable
              @click="$q.notify('Thanks! This message has been flagged for review in this demo.')"
              ><q-item-section>Report message</q-item-section></q-item
            ></q-list
          ></q-menu
        ></q-btn
      >
    </div>
  </article>
</template>
