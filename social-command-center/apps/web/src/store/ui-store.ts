import { create } from 'zustand';

type ActiveTab = 'compose' | 'queue' | 'analytics' | 'connections';
type Theme = 'light' | 'dark';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('scc-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('scc-theme', theme);
}

interface UIState {
  activeTab: ActiveTab;
  notifications: Notification[];
  sidebarOpen: boolean;
  theme: Theme;

  setActiveTab: (tab: ActiveTab) => void;
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeTab: 'compose',
  notifications: [],
  sidebarOpen: true,
  theme: getInitialTheme(),

  setActiveTab: (activeTab) => set({ activeTab }),

  addNotification: (notif) =>
    set((state) => ({
      notifications: [
        {
          ...notif,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: Date.now(),
          read: false,
        },
        ...state.notifications,
      ].slice(0, 50),
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),

  clearNotifications: () => set({ notifications: [] }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    set({ theme: next });
  },

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
}));

export type { ActiveTab, Theme, Notification };
