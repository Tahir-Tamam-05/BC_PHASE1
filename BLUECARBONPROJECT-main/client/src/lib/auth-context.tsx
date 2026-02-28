import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('bluecarbon_user');
    const storedToken = localStorage.getItem('bluecarbon_token');

    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null' && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('bluecarbon_user');
        localStorage.removeItem('bluecarbon_token');
      }
    }
  }, []);

  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem('bluecarbon_user', JSON.stringify(user));
    localStorage.setItem('bluecarbon_token', token);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('bluecarbon_user', JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const { apiRequest } = await import('./queryClient');
      const response = await apiRequest('GET', '/api/auth/profile');
      if (response.ok) {
        const updatedUser = await response.json();
        console.log('[AUTH_DEBUG] Refreshed user profile:', updatedUser);
        updateUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bluecarbon_user');
    localStorage.removeItem('bluecarbon_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, updateUser, refreshUser, logout, isAuthenticated: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
