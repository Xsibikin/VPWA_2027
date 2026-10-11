export type UserState = 'Online' | 'DND' | 'Offline';

export interface User {
  id: string; // uuid
  name: string;
  lastName: string;
  nick: string;
  email: string;
  state: UserState;
  mentionOnlyNotif: boolean;
}

export interface UserWithPassword extends User {
  password: string;
}
