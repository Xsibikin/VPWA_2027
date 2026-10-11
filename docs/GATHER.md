# Gather — Slack-style demo workspace

A UI-only Vue 3 / Quasar v2 application using Composition API, script setup,
TypeScript, Vite, Pinia, and Vue Router. The workspace is called **Studio North**.

## Run

From the repository root:

```sh
pnpm install
pnpm dev
```

This repository uses a pnpm workspace. Install and run with pnpm.
The default development URL is http://localhost:9000.

Demo credentials: **demo@slack.clone / demo1234**. The **Use demo workspace**
button fills the credentials automatically and signs in with one mock request.

```sh
pnpm --filter @vpwa/frontend typecheck
pnpm --filter @vpwa/frontend exec eslint "src/**/*.{ts,vue}"
pnpm build:frontend
```

## Application files

```text
apps/frontend/
├── index.html
├── package.json
├── quasar.config.ts
├── env.d.ts
├── tsconfig.json
├── eslint.config.js
├── postcss.config.js
├── public/
│   └── gather.svg
└── src/
    ├── App.vue
    ├── types.ts
    ├── boot/
    │   └── theme.ts
    ├── components/
    │   ├── ChatMessage.vue
    │   └── MessageComposer.vue
    ├── css/
    │   ├── app.scss
    │   └── quasar.variables.scss
    ├── mocks/
    │   └── data.ts
    ├── pages/
    │   ├── AuthPage.vue
    │   └── ChatPage.vue
    ├── router/
    │   ├── index.ts
    │   └── routes.ts
    ├── services/
    │   └── api.ts
    └── stores/
        ├── index.ts
        ├── auth.ts
        ├── workspace.ts
        └── chat.ts
```

All implementation files above are provided in the workspace. The repository's
earlier scaffold files also remain present; routing uses only the two new pages.

## Interaction guide

- `/auth`: login/register forms, field validation, password visibility, demo login.
- `/`: authenticated workspace with 72 px rail and 260 px channel drawer.
- Choose one of eight channels or six individual DMs. Each starts with 30 messages.
- Search/filter channels and teammates from either workspace search input.
- Search messages using the conversation-header search button.
- Send with Enter; use Shift + Enter for a new line. Emoji picker and @ insertion
  work in both main and thread composers.
- Hover/focus a message for reactions, reply in thread, copy, and session-only bookmark.
- Five seeded threads have five replies each. Any message can start a new thread.
- Threads use a 360 px initial resizable desktop pane and an overlay mobile drawer.
- Add channels with the sidebar plus button. A new channel shows an empty state.
- Click member avatars to browse members and jump into an individual DM.
- Toggle the complete light/dark theme using the rail, preferences, or workspace menu.
- Login, sends, errors, and logout use Quasar Notify; requests show skeleton loaders.
- Rich formatting, clips, uploads, app integrations, and huddles are explicit UI stubs.
- The typing indicator is a labeled demo animation, not live presence.

## AdonisJS boundary

`src/services/api.ts` is the only app file importing `src/mocks/data.ts`.
The three domain stores call API functions; components read stores.
Every exported API function returns a mocked Promise with 400 ms latency and an
endpoint-specific `TODO: AdonisJS` comment. Channel and DM messages have separate
list/send functions; threaded replies have a separate list/send pair.

Replace the implementations in `api.ts` with `fetch` calls returning the types in
`types.ts`. All required API functions are implemented, plus `getWorkspace` and
`createChannel` for the workspace header and channel creation.

Mock messages, reactions, and created channels persist for the current page session.
Demo/registered authentication and appearance persist in localStorage. Registered
credentials are stored locally solely to make the UI-only registration flow testable.
The real authentication implementation belongs entirely in the API boundary.

Avatars come from Pravatar/DiceBear. Inter and the auth-page serif heading load from
Google Fonts, with local system/Georgia fallbacks.
