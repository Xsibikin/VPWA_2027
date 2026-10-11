import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { User } from '@vpwa/shared';
import { authService, type LoginDto, type RegisterDto } from '@/services/auth.service';

const currentUser = ref<User | null>(authService.getUserFromStorage());
const isLoading = ref(false);

export function useAuth() {
  const router = useRouter();

  const isAuthenticated = computed(() => !!currentUser.value);

  async function login(credentials: LoginDto) {
    isLoading.value = true;
    try {
      const user = await authService.login(credentials);
      currentUser.value = user;
      await router.push('/chat');
    } finally {
      isLoading.value = false;
    }
  }

  async function register(data: RegisterDto) {
    isLoading.value = true;
    try {
      return await authService.register(data);
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    isLoading.value = true;
    try {
      authService.logout();
      currentUser.value = null;
      await router.push('/');
    } finally {
      isLoading.value = false;
    }
  }

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
}
