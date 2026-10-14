import type { User, UserState } from '@/types';

export const fullName = (user: Pick<User, 'name' | 'lastName'>) =>
  `${user.name} ${user.lastName}`.trim();

// CSS modifier for the presence dot: online | dnd | offline
export const presenceClass = (state: UserState | undefined) => (state ?? 'Offline').toLowerCase();

export const stateLabels: Record<UserState, string> = {
  Online: 'Online',
  DND: 'Do not disturb',
  Offline: 'Offline',
};
