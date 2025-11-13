import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number; // in milliseconds, 0 means persistent
  timestamp: number;
}

interface UIState {
  // State
  activeView: 'config' | 'results' | 'history';
  theme: 'light' | 'dark';
  sidebarExpanded: boolean;
  notifications: Notification[];
  loadingStates: {
    [key: string]: boolean;
  };

  // Actions
  actions: {
    setActiveView: (view: 'config' | 'results' | 'history') => void;
    toggleTheme: () => void;
    toggleSidebar: () => void;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
    setLoading: (key: string, loading: boolean) => void;
    getLoading: (key: string) => boolean;
  };
}

export const useUIStore = create<UIState>()(
  persist(
    immer((set, get) => ({
      activeView: 'config',
      theme: 'light',
      sidebarExpanded: true,
      notifications: [],
      loadingStates: {},
      actions: {
        setActiveView: (view) =>
          set((state) => {
            state.activeView = view;
          }),
        toggleTheme: () =>
          set((state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
          }),
        toggleSidebar: () =>
          set((state) => {
            state.sidebarExpanded = !state.sidebarExpanded;
          }),
        addNotification: (notification) =>
          set((state) => {
            const id = Date.now().toString();
            state.notifications.push({
              ...notification,
              id,
              timestamp: Date.now(),
            });
            // Auto-remove notifications after duration (except persistent ones)
            if (notification.duration && notification.duration > 0) {
              setTimeout(() => {
                state.notifications = state.notifications.filter((n: Notification) => n.id !== id);
              }, notification.duration);
            }
            // Keep only last 50 notifications
            if (state.notifications.length > 50) {
              state.notifications = state.notifications.slice(-50);
            }
          }),
        removeNotification: (id) =>
          set((state) => {
            state.notifications = state.notifications.filter((n: Notification) => n.id !== id);
          }),
        clearNotifications: () =>
          set((state) => {
            state.notifications = [];
          }),
        setLoading: (key, loading) =>
          set((state) => {
            state.loadingStates[key] = loading;
          }),
        getLoading: (key) => {
          const state = get();
          return state.loadingStates[key] || false;
        },
      },
    })),
    {
      name: 'hydraulic-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarExpanded: state.sidebarExpanded,
      }),
      version: 1,
    }
  )
);

// Selector hooks for better performance
export const useActiveView = () => useUIStore((state) => state.activeView);
export const useTheme = () => useUIStore((state) => state.theme);
export const useSidebarExpanded = () => useUIStore((state) => state.sidebarExpanded);
export const useNotifications = () => useUIStore((state) => state.notifications);
export const useLoading = (key: string) => useUIStore((state) => state.loadingStates[key] || false);
export const useUIActions = () => useUIStore((state) => state.actions);