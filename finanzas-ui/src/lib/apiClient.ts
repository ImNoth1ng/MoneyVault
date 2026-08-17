import axios, { AxiosInstance, AxiosError } from 'axios';
import { isTokenExpired } from '../utils/jwtUtils';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token JWT y verificar expiración previa a la solicitud
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          if (isTokenExpired(token)) {
            this.clearToken();
            useAuthStore.getState().logout();
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
              window.location.href = '/login';
            }
            return Promise.reject(new axios.Cancel('JWT token expirado'));
          }
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para manejar errores
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          this.clearToken();
          useAuthStore.getState().logout();
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private clearToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  public setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export default new ApiClient();

