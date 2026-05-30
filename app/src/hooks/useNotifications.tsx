import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Notification, NotificationType, UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface NotifyOptions {
  audience: { role: UserRole; userId?: string };
  type: NotificationType;
  title: string;
  message: string;
  caseId?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  notify: (opts: NotifyOptions) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [all, setAll] = useState<Notification[]>([]);

  const notify = useCallback((opts: NotifyOptions) => {
    const n: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      audience: opts.audience,
      type: opts.type,
      title: opts.title,
      message: opts.message,
      caseId: opts.caseId,
      isRead: false,
      createdAt: new Date(),
    };
    setAll(prev => [n, ...prev].slice(0, 200));
  }, []);

  const notifications = useMemo(() => {
    if (!user) return [];
    return all.filter(n => {
      if (n.audience.role !== user.role) return false;
      if (n.audience.userId && n.audience.userId !== user.id) return false;
      return true;
    });
  }, [all, user]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications],
  );

  const markRead = useCallback((id: string) => {
    setAll(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    if (!user) return;
    setAll(prev =>
      prev.map(n => {
        if (n.audience.role !== user.role) return n;
        if (n.audience.userId && n.audience.userId !== user.id) return n;
        return { ...n, isRead: true };
      }),
    );
  }, [user]);

  const clearAll = useCallback(() => {
    if (!user) return;
    setAll(prev =>
      prev.filter(n => {
        if (n.audience.role !== user.role) return true;
        if (n.audience.userId && n.audience.userId !== user.id) return true;
        return false;
      }),
    );
  }, [user]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, notify, markRead, markAllRead, clearAll }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
