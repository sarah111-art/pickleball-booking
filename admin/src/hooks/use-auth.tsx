import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '@/lib/api';

export type Role = 'manager' | 'staff';
export type PermissionAction = 'view' | 'add' | 'edit' | 'delete';

export interface Permission {
  section: string;
  actions: PermissionAction[];
}

export interface User {
  id?: string;
  email: string;
  role: Role;
  fullName?: string;
  permissions?: Permission[];
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  hasPermission: (section: string, action?: PermissionAction) => boolean;
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

  const refreshProfile = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const res = await api.get<User>('/auth/profile');
    if (res.data) {
      localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      setUser(res.data);
    }
  };

  useEffect(() => {
    if (!user && localStorage.getItem('accessToken')) {
      refreshProfile();
      return;
    }

    if (user && localStorage.getItem('accessToken')) {
      refreshProfile();
    }
  }, []);

  const hasPermission = (section: string, action: PermissionAction = 'view') => {
    if (!user) return false;
    if (user.role === 'manager' && (!user.permissions || user.permissions.length === 0)) {
      return true;
    }

    // Backward compatibility: older accounts may not have new section permissions yet.
    // Reuse existing rackets permission for racket_orders until permissions are re-saved.
    const normalizedSection =
      section === 'racket_orders' &&
      !user.permissions?.some((item) => item.section === 'racket_orders')
        ? 'rackets'
        : section === 'news' &&
            !user.permissions?.some((item) => item.section === 'news')
          ? 'reviews'
          : section;

    const permission = user.permissions?.find((item) => item.section === normalizedSection);
    return Boolean(permission?.actions?.includes(action));
  };

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
    <AuthContext.Provider value={{ user, login, logout, refreshProfile, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
