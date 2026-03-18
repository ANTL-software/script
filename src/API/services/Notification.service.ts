import { apiCalls } from '../APICalls';
import type { Notification } from '../../utils/types';

interface NotificationsResponse {
  success: boolean;
  message: string;
  data: Notification[];
  count: number;
  non_lues: number;
}

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
    const response = await apiCalls.get<NotificationsResponse>(`/notifications/me${query}`);
    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la récupération des notifications');
    }
    const payload = response.data as unknown as NotificationsResponse;
    return {
      notifications: payload?.data ?? [],
      non_lues: payload?.non_lues ?? 0
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
