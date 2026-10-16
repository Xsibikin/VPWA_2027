import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '@/services/api';
import type { RegisterPayload, User, UserSettings } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const initialized = ref(false);

  async function restore() {
    if (initialized.value) return;
    try {
      user.value = await api.me();
    } catch {
      user.value = null;
    }
    initialized.value = true;
  }

  async function login(email: string, password: string) {
    user.value = await api.login(email, password);
  }

  async function register(payload: RegisterPayload) {
    user.value = await api.register(payload);
  }

  async function logout() {
    await api.logout();
    user.value = null;
  }

  async function updateSettings(settings: Partial<UserSettings>) {
    user.value = await api.updateSettings(settings);
  }

  return { user, initialized, restore, login, register, logout, updateSettings };
});
