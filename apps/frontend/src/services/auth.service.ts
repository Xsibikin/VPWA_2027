import type { User } from '@vpwa/shared';

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export interface LoginDto {
  username: string;
  password?: string;
}

export interface RegisterDto {
  username: string;
  password?: string;
  name?: string;
  lastName?: string;
  email?: string;
}

const USE_MOCK = true;

class AuthService {
  async login(credentials: LoginDto): Promise<User> {
    if (USE_MOCK) {
      await delay(400);

      const mockUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John',
        lastName: 'Doe',
        nick: credentials.username,
        email: `${credentials.username.toLowerCase()}@vpwa.sk`,
        state: 'Online',
        mentionOnlyNotif: false,
      };

      localStorage.setItem('auth_token', 'mock-jwt-token-xyz');
      localStorage.setItem('auth_user', JSON.stringify(mockUser));

      return mockUser;
    }

    throw new Error('Backend server is not connected yet.');
  }

  async register(data: RegisterDto): Promise<User> {
    if (USE_MOCK) {
      await delay(400);

      const newUser: User = {
        id: '987fcdeb-51a2-43f7-9abc-123456789def',
        name: data.name || data.username,
        lastName: data.lastName || '',
        nick: data.username,
        email: data.email || `${data.username.toLowerCase()}@vpwa.sk`,
        state: 'Online',
        mentionOnlyNotif: false,
      };

      localStorage.setItem('auth_token', 'mock-jwt-token-xyz');
      localStorage.setItem('auth_user', JSON.stringify(newUser));

      return newUser;
    }

    throw new Error('Backend server is not connected yet.');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  getUserFromStorage(): User | null {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  }
}

export const authService = new AuthService();
