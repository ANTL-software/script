import { apiCalls } from '../APICalls';
import { throwIfApiError } from '../apiHelpers';
import type { Notification } from '../../utils/types';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async getMyNotifications(lu?: boolean): Promise<{ notifications: Notification[]; non_lues: number }> {
    const query = lu !== undefined ? `?lu=${lu}` : '';
    const response = await apiCalls.get<Notification[]>(`/notifications/me${query}`);
    const data = throwIfApiError(response, 'Erreur lors de la récupération des notifications');
    const notifications = Array.isArray(data) ? data : [];
    return {
      notifications,
      non_lues: notifications.filter(n => !n.lu).length,
    };
  }

  public async marquerCommeLue(id: number): Promise<void> {
    const response = await apiCalls.patch(`/notifications/${id}/lire`);
    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la mise à jour');
    }
  }

  public async marquerToutCommeLu(): Promise<void> {
    const response = await apiCalls.patch('/notifications/lire-tout');
    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la mise à jour');
    }
  }
}

export const notificationService = NotificationService.getInstance();
