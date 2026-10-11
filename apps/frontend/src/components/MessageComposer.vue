<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';

defineProps<{ placeholder: string; loading?: boolean; compact?: boolean }>();
const emit = defineEmits<{ send: [text: string] }>();
const text = ref('');
const input = ref<{ focus: () => void } | null>(null);
const $q = useQuasar();
const emojis = ['😊', '🙌', '💚', '🎉', '🚀', '👍', '✨', '☕', '👀', '🔥', '😂', '💡'];
function insert(value: string) {
  text.value += value;
  input.value?.focus();
}
function send() {
  if (text.value.trim()) emit('send', text.value);
}
function clear() {
  text.value = '';
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    send();
  }
}
defineExpose({ clear });
</script>

<template>
  <div class="composer" :class="{ compact }">
    <div class="format-toolbar">
      <q-btn
        v-for="(icon, i) in [
          'format_bold',
          'format_italic',
          'format_strikethrough',
          'link',
          'format_list_bulleted',
          'code',
        ]"
        :key="icon"
        flat
        dense
        size="sm"
        :icon="icon"
        :aria-label="['Bold', 'Italic', 'Strikethrough', 'Insert link', 'Bulleted list', 'Code'][i]"
        @click="
          $q.notify({ message: 'Rich text formatting is coming soon.', icon: 'format_shapes' })
        "
        ><q-tooltip>{{
          ['Bold', 'Italic', 'Strikethrough', 'Link', 'Bulleted list', 'Code'][i]
        }}</q-tooltip></q-btn
      >
    </div>
    <q-input
      ref="input"
      v-model="text"
      borderless
      autogrow
      :placeholder="placeholder"
      :disable="loading"
      class="composer-input"
      aria-label="Message text"
      @keydown="keydown"
    />
    <div class="composer-bottom">
      <div class="row items-center">
        <q-btn
          flat
          round
          dense
          icon="add"
          size="sm"
          aria-label="Attach file"
          @click="$q.notify({ message: 'File attachments are coming soon.', icon: 'attach_file' })"
          ><q-tooltip>Attach a file</q-tooltip></q-btn
        >
        <q-btn flat round dense icon="sentiment_satisfied_alt" size="sm" aria-label="Choose emoji">
          <q-tooltip>Add an emoji</q-tooltip
          ><q-menu class="emoji-menu"
            ><div class="emoji-grid">
              <q-btn
                v-for="emoji in emojis"
                :key="emoji"
                v-close-popup
                flat
                :label="emoji"
                @click="insert(emoji)"
              /></div
          ></q-menu>
        </q-btn>
        <q-btn
          flat
          round
          dense
          icon="alternate_email"
          size="sm"
          aria-label="Mention someone"
          @click="insert('@')"
          ><q-tooltip>Mention someone</q-tooltip></q-btn
        >
        <q-separator vertical inset class="q-mx-sm" />
        <q-btn
          flat
          round
          dense
          icon="videocam"
          size="sm"
          aria-label="Record clip"
          @click="$q.notify('Video clips are coming soon.')"
          ><q-tooltip>Record a clip</q-tooltip></q-btn
        >
      </div>
      <q-btn
        unelevated
        color="primary"
        icon="send"
        :loading="loading"
        :disable="!text.trim() || loading"
        class="send-button"
        aria-label="Send message"
        @click="send"
        ><q-tooltip>Send · Enter</q-tooltip></q-btn
      >
    </div>
  </div>
</template>
