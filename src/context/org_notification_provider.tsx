import { useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { Authcontext } from "./auth_context";
import { OrgNotificationContext, type OrgNotificationContextType } from "./org_notification_context";
import type { OrgNotification, OrgNotificationSettings } from "@/data/orgNotifications";

const POLL_INTERVAL = 30000;

export default function OrgNotificationProvider({ children }: { children: ReactNode }) {
  const { orgUser } = useContext(Authcontext);
  const [notifications, setNotifications] = useState<OrgNotification[]>([]);
  const [settings, setSettingsState] = useState<OrgNotificationSettings>({ allow_admin_delete: false });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!orgUser) return;
    try {
      const feed = await api.org.notifications.getFeed();
      setNotifications(feed.notifications);
      setSettingsState(feed.settings);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [orgUser]);

  useEffect(() => {
    if (!orgUser) return;
    const timer = setTimeout(() => { void fetch(); }, 0);
    const interval = setInterval(() => { void fetch(); }, POLL_INTERVAL);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [orgUser, fetch]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!orgUser) return;
      await api.org.notifications.markRead(id);
      setNotifications(prev =>
        prev.map(n =>
          n.id === id && !n.read_by.includes(orgUser.id)
            ? { ...n, read_by: [...n.read_by, orgUser.id] }
            : n,
        ),
      );
    },
    [orgUser],
  );

  const markAllAsRead = useCallback(async () => {
    if (!orgUser) return;
    await api.org.notifications.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read_by: [...new Set([...n.read_by, orgUser.id])] })));
  }, [orgUser]);

  const deleteNotification = useCallback(async (id: string) => {
    await api.org.notifications.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(async () => {
    await api.org.notifications.clearAll();
    setNotifications([]);
  }, []);

  const setSettings = useCallback(async (patch: Partial<OrgNotificationSettings>) => {
    const next = await api.org.notifications.setSettings(patch);
    setSettingsState(next);
  }, []);

  const unreadCount = orgUser
    ? notifications.filter(n => !n.read_by.includes(orgUser.id)).length
    : 0;
  const canDelete =
    !!orgUser &&
    (orgUser.role === 'super-admin' || (orgUser.role === 'admin' && settings.allow_admin_delete));

  const value: OrgNotificationContextType = {
    notifications,
    unreadCount,
    loading,
    canDelete,
    settings,
    fetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    setSettings,
  };

  return <OrgNotificationContext.Provider value={value}>{children}</OrgNotificationContext.Provider>;
}
