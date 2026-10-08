import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types.ts';
import { api, tokenStorage } from '../services/api.ts';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  reasons?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshUser = async () => {
    const token = tokenStorage.get();
    if (!token) {
      // Auto-login default demo student on fresh visit so the exact Stitch screen appears immediately!
      try {
        const res = await api.auth.quickSwitch('STUDENT');
        if (res.user) {
          setUser(res.user);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await api.auth.me();
      if (res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      tokenStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.auth.login(email, password);
      if (res.user) {
        setUser(res.user);
        setActiveTab('dashboard');
        setShowAuthModal(false);
        showToast({
          type: 'success',
          title: 'Welcome Back',
          message: `Logged in successfully as ${res.user.name} (${res.user.role}).`,
        });
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Authentication Failed',
        message: error.message || 'Invalid credentials. Please try again.',
      });
      throw error;
    }
  };

  const register = async (payload: any) => {
    try {
      const res = await api.auth.register(payload);
      if (res.user) {
        setUser(res.user);
        setActiveTab('dashboard');
        setShowAuthModal(false);
        showToast({
          type: 'success',
          title: 'Registration Successful',
          message: `Account created for ${res.user.name}. Welcome to CampusVelocity!`,
        });
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Registration Failed',
        message: error.message || 'Unable to complete registration.',
      });
      throw error;
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setActiveTab('dashboard');
    showToast({
      type: 'info',
      title: 'Logged Out',
      message: 'You have been logged out of the placement portal.',
    });
  };

  const quickSwitchRole = async (role: UserRole) => {
    setLoading(true);
    try {
      const res = await api.auth.quickSwitch(role);
      if (res.user) {
        setUser(res.user);
        setActiveTab('dashboard');
        showToast({
          type: 'success',
          title: `Role Switched to ${role}`,
          message: `Active session set to ${res.user.name} (${role}).`,
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Switch Failed',
        message: err.message || 'Could not switch demo role.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        activeTab,
        setActiveTab,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        showAuthModal,
        setShowAuthModal,
        toasts,
        showToast,
        removeToast,
        login,
        register,
        logout,
        quickSwitchRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
