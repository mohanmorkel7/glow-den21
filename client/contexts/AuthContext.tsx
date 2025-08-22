import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'project_manager' | 'user';
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setUser(user);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Mock authentication - in real app, call backend API
      let mockUser: User | null = null;

      // Demo credentials for different roles
      if (email === 'admin@websyntactic.com' && password === 'admin123') {
        mockUser = {
          id: '1',
          email: 'admin@websyntactic.com',
          name: 'John Smith',
          role: 'super_admin',
          permissions: ['all']
        };
      } else if (email === 'pm@websyntactic.com' && password === 'pm123') {
        mockUser = {
          id: '2',
          email: 'pm@websyntactic.com',
          name: 'Emily Wilson',
          role: 'project_manager',
          permissions: ['project_management', 'file_process', 'user_assignment']
        };
      } else if (email === 'user@websyntactic.com' && password === 'user123') {
        mockUser = {
          id: '3',
          email: 'user@websyntactic.com',
          name: 'Sarah Johnson',
          role: 'user',
          permissions: ['file_request', 'daily_counts']
        };
      }

      if (mockUser) {
        setUser(mockUser);
        localStorage.setItem('token', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify(mockUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
