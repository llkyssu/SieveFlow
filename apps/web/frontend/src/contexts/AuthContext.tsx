'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  authService,
  type User,
  type LoginCredentials,
  type RegisterData,
  ApiRequestError,
} from '@/services';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Cargar usuario al iniciar
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Primero intentar cargar desde localStorage
        const storedUser = authService.getUser();
        if (storedUser) {
          setUser(storedUser);
        }

        // Verificar si el token es válido obteniendo el perfil
        if (authService.isAuthenticated()) {
          const profile = await authService.getProfile();
          setUser(profile);
        }
      } catch (error) {
        // Si el token es inválido, limpiar sesión
        if (error instanceof ApiRequestError && error.isUnauthorized) {
          authService.logout();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await authService.login(credentials);
      setUser(response.user);
      router.push('/dashboard');
    },
    [router]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const response = await authService.register(data);
      setUser(response.user);
      router.push('/dashboard');
    },
    [router]
  );

  const logout = useCallback(() => {
    setUser(null);
    authService.logout();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (error) {
      if (error instanceof ApiRequestError && error.isUnauthorized) {
        logout();
      }
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
