import { createContext } from 'react';
import type { ModalType, ToastNotification, ViewType } from '../../utils/types/index.ts';

export type { ModalType, ToastNotification, ViewType } from '../../utils/types/index.ts';

export interface AppContextType {
  currentModal: ModalType;
  currentView: ViewType;
  notifications: ToastNotification[];
  isAppLoading: boolean;

  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setView: (view: ViewType) => void;
  addNotification: (notification: Omit<ToastNotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setAppLoading: (loading: boolean) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
