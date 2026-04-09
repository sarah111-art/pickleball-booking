import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type Role = 'manager' | 'staff';

export interface User {
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'admin_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      const token = localStorage.getItem('accessToken');
      // Chỉ khôi phục session nếu có cả user info lẫn token
      if (stored && token) return JSON.parse(stored) as User;
      // Token không tồn tại → xóa user cũ, bắt đăng nhập lại
      if (stored) localStorage.removeItem(USER_KEY);
      return null;
    } catch {
      return null;
    }
  });

  const login = (newUser: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };
  const logout = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
