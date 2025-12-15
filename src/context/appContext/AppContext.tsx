import { createContext } from 'react';

export type ModalType = 'qui-est-ce' | 'qui-sommes-nous' | 'objections' | 'plan-appel' | null;
export type ViewType = 'default' | 'historique-appels' | 'historique-offres' | 'commande';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface AppContextType {
  currentModal: ModalType;
  currentView: ViewType;
  notifications: Notification[];
  isAppLoading: boolean;

  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setView: (view: ViewType) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setAppLoading: (loading: boolean) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
