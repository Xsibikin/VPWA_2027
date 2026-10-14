<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useQuasar, type QInput } from 'quasar';
import type { CommandInfo } from '@/services/commands';
import type { User } from '@/types';
import { fullName, presenceClass } from '@/utils/user';

const props = defineProps<{
  placeholder: string;
  loading?: boolean;
  compact?: boolean;
  // People offered after "@"; commands offered after "/" at the start of the line.
  users?: User[];
  commands?: CommandInfo[];
  // People offered as the argument of a command, e.g. non-members after "/invite ".
  commandUsers?: Partial<Record<CommandInfo['name'], User[]>>;
}>();
const emit = defineEmits<{ send: [text: string] }>();
const text = ref('');
const input = ref<QInput | null>(null);
const $q = useQuasar();
const emojis = ['😊', '🙌', '💚', '🎉', '🚀', '👍', '✨', '☕', '👀', '🔥', '😂', '💡'];
const MAX_SUGGESTIONS = 8;

type Suggestion = { kind: 'command'; command: CommandInfo } | { kind: 'user'; user: User };
// The word being typed right before the caret: "/jo", "@ol" or the nick after "/kick ".
// `start` is where the word begins, `people` the list to pick from, `prefix` what goes before a nick.
const query = ref<
  | { kind: 'command'; start: number; text: string }
  | { kind: 'user'; start: number; text: string; people: User[]; prefix: string }
  | null
>(null);
const active = ref(0);
const suggestions = computed<Suggestion[]>(() => {
  const q = query.value;
  if (!q) return [];
  const term = q.text.toLowerCase();
  if (q.kind === 'command')
    return (props.commands ?? [])
      .filter((command) => command.name.startsWith(term))
      .map((command) => ({ kind: 'command', command }));
  return q.people
    .filter((user) =>
      [user.nick, user.name, user.lastName].some((value) => value.toLowerCase().startsWith(term)),
    )
    .slice(0, MAX_SUGGESTIONS)
    .map((user) => ({ kind: 'user', user }));
});

const caret = () => input.value?.getNativeElement().selectionStart ?? text.value.length;

// Looks at the text before the caret and decides whether a suggestion list should be open.
function detect() {
  const before = text.value.slice(0, caret());
  const command = /^\/(\w*)$/.exec(before);
  const argument = /^\/(\w+)\s+(@?[\w-]*)$/.exec(before);
  const mention = /(?:^|\s)@([\w-]*)$/.exec(before);
  const argumentUsers = props.commandUsers?.[argument?.[1] as CommandInfo['name']];
  active.value = 0;
  if (command && props.commands?.length)
    query.value = { kind: 'command', start: 0, text: command[1] ?? '' };
  else if (argument && argumentUsers) {
    // "/kick ol" or "/kick @ol": the nick is replaced as a whole, without the @.
    const word = argument[2] ?? '';
    query.value = {
      kind: 'user',
      start: before.length - word.length,
      text: word.replace(/^@/, ''),
      people: argumentUsers,
      prefix: '',
    };
  } else if (mention && props.users?.length) {
    const term = mention[1] ?? '';
    query.value = {
      kind: 'user',
      start: before.length - term.length - 1,
      text: term,
      people: props.users,
      prefix: '@',
    };
  } else query.value = null;
}

function moveCaret(position: number) {
  void nextTick(() => {
    input.value?.focus();
    input.value?.getNativeElement().setSelectionRange(position, position);
    detect();
  });
}

function accept(suggestion: Suggestion) {
  const q = query.value;
  if (!q) return;
  const value =
    suggestion.kind === 'command'
      ? `/${suggestion.command.name} `
      : `${q.kind === 'user' ? q.prefix : ''}${suggestion.user.nick} `;
  text.value = text.value.slice(0, q.start) + value + text.value.slice(caret());
  query.value = null;
  moveCaret(q.start + value.length);
}

function insert(value: string) {
  text.value += value;
  moveCaret(text.value.length);
}
function send() {
  if (props.loading || !text.value.trim()) return;
  emit('send', text.value);
  // Clicking the send button moves focus to it; bring it back so typing can go on.
  input.value?.focus();
}
function clear() {
  text.value = '';
  query.value = null;
}
function keydown(event: KeyboardEvent) {
  if (event.isComposing) return;
  const count = suggestions.value.length;
  if (count) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      active.value = (active.value + (event.key === 'ArrowDown' ? 1 : count - 1)) % count;
      return;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const suggestion = suggestions.value[active.value];
      if (suggestion) accept(suggestion);
      return;
    }
    if (event.key === 'Escape') {
      event.stopPropagation();
      query.value = null;
      return;
    }
  }
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    send();
  }
}
// Arrow keys and clicks move the caret without changing the text, so re-check after them.
function keyup(event: KeyboardEvent) {
  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) detect();
}
defineExpose({ clear });
</script>

<template>
  <div class="composer-host">
    <div
      v-if="query && suggestions.length"
      class="composer-suggestions"
      role="listbox"
      :aria-label="query.kind === 'command' ? 'Commands' : 'People'"
    >
      <div class="suggestions-title">{{ query.kind === 'command' ? 'Commands' : 'People' }}</div>
      <div
        v-for="(suggestion, index) in suggestions"
        :key="suggestion.kind === 'command' ? suggestion.command.name : suggestion.user.id"
        class="suggestion"
        :class="{ active: index === active }"
        role="option"
        :aria-selected="index === active"
        @mousedown.prevent="accept(suggestion)"
        @mouseenter="active = index"
      >
        <template v-if="suggestion.kind === 'command'"
          ><span class="suggestion-command">/{{ suggestion.command.name }}</span
          ><span class="suggestion-args">{{ suggestion.command.args }}</span
          ><span class="suggestion-detail">{{ suggestion.command.description }}</span></template
        >
        <template v-else
          ><div class="dm-avatar">
            <q-avatar size="24px"
              ><img :src="suggestion.user.avatar" :alt="fullName(suggestion.user)" /></q-avatar
            ><span class="presence" :class="presenceClass(suggestion.user.state)"></span>
          </div>
          <span class="suggestion-name">{{ fullName(suggestion.user) }}</span
          ><span class="suggestion-detail">@{{ suggestion.user.nick }}</span></template
        >
      </div>
    </div>
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
          :aria-label="
            ['Bold', 'Italic', 'Strikethrough', 'Insert link', 'Bulleted list', 'Code'][i]
          "
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
        :readonly="loading"
        class="composer-input"
        aria-label="Message text"
        @keydown="keydown"
        @keyup="keyup"
        @update:model-value="detect"
        @click="detect"
        @blur="query = null"
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
            @click="
              $q.notify({ message: 'File attachments are coming soon.', icon: 'attach_file' })
            "
            ><q-tooltip>Attach a file</q-tooltip></q-btn
          >
          <q-btn
            flat
            round
            dense
            icon="sentiment_satisfied_alt"
            size="sm"
            aria-label="Choose emoji"
          >
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
  </div>
</template>
