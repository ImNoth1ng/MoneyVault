import apiClient from '../lib/apiClient';
import {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  User,
} from '../types';

const client = apiClient.getClient();

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const { data } = await client.post<AuthResponse>('/auth/login', credentials);
    if (data.token) {
      apiClient.setToken(data.token);
      const userObj: User = {
        id: String(data.userId),
        username: data.username,
        email: data.email,
        firstName: data.username,
        lastName: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('user', JSON.stringify(userObj));
    }
    return data;
  },

  register: async (payload: RegisterRequest): Promise<string> => {
    const { data } = await client.post('/auth/register', payload);
    return data;
  },

  changePassword: async (payload: ChangePasswordRequest): Promise<string> => {
    const { data } = await client.post('/auth/change-password', payload);
    return data;
  },

  logout: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await client.get<User>('/auth/me');
    return data;
  },

  validateToken: async (): Promise<boolean> => {
    try {
      await client.post('/auth/validate-token');
      return true;
    } catch {
      return false;
    }
  },
};
