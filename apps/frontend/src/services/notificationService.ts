import { api } from '../lib/api';

export interface AppNotification {
  notification_id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  created_date: string;
}

export const notificationService = {
  async notifyMe(message: string) {
    await api.post('/notifications/self', { message });
  },

  async notifyManagers(message: string) {
    await api.post('/notifications/managers', { message });
  },

  async notifyParent(parentId: number, message: string) {
    await api.post('/notifications/parent', { parentId, message });
  },

  async getMine(): Promise<AppNotification[]> {
    const { data } = await api.get<{ notifications: AppNotification[] }>('/notifications');
    return data.notifications;
  },

  async markAllAsRead() {
    await api.patch('/notifications/read-all');
  },
};
