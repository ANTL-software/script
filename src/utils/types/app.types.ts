export type ModalType = 'qui-est-ce' | 'qui-sommes-nous' | 'objections' | 'plan-appel' | null;

export type ViewType =
  | 'qui-est-ce'
  | 'qui-sommes-nous'
  | 'historique-appels'
  | 'historique-offres'
  | 'historique-rendez-vous'
  | 'rendez-vous'
  | 'commande';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
