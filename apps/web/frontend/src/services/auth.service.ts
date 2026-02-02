import { apiClient } from './api-client';

// Tipos para autenticación
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
}

const TOKEN_KEY = 'sieveflow-token';
const USER_KEY = 'sieveflow-user';

export const authService = {
  /**
   * Registrar un nuevo usuario
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    this.saveSession(response);
    return response;
  },

  /**
   * Iniciar sesión
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/auth/login',
      credentials
    );
    this.saveSession(response);
    return response;
  },

  /**
   * Cerrar sesión
   */
  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Redirigir a login
    window.location.href = '/login';
  },

  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(): Promise<User> {
    return apiClient.get<User>('/auth/profile');
  },

  /**
   * Guardar sesión en localStorage
   */
  saveSession(response: AuthResponse): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, response.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  },

  /**
   * Obtener token actual
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Obtener usuario actual desde localStorage
   */
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
