import type { InjectionKey } from 'vue';

// Lets a deeply nested component (the profile card inside a message) open a direct message
// without passing events up through every parent. ChatPage provides it.
export interface DirectMessages {
  canMessage: (userId: string) => boolean;
  open: (userId: string) => Promise<void>;
}
export const directMessagesKey: InjectionKey<DirectMessages> = Symbol('directMessages');
