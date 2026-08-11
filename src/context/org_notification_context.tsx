import { createContext } from "react";
import type { OrgNotification, OrgNotificationSettings } from "@/lib/orgTypes";

export interface OrgNotificationContextType {
  notifications: OrgNotification[];
  unreadCount: number;
  loading: boolean;
  canDelete: boolean;
  settings: OrgNotificationSettings;
  fetch: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  setSettings: (patch: Partial<OrgNotificationSettings>) => Promise<void>;
}

export const OrgNotificationContext = createContext<OrgNotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  canDelete: false,
  settings: { allow_admin_delete: false },
  fetch: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  clearAll: async () => {},
  setSettings: async () => {},
});
