import { useState, useCallback } from 'react';
import { AppContext } from './AppContext';
import type { ModalType, ViewType, Notification } from './AppContext';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  const [currentView, setCurrentView] = useState<ViewType>('default');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(false);

  const openModal = useCallback((modal: ModalType) => {
    console.log(`[APP] Ouverture modal: ${modal}`);
    setCurrentModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    console.log('[APP] Fermeture modal');
    setCurrentModal(null);
  }, []);

  const setView = useCallback((view: ViewType) => {
    console.log(`[APP] Changement de vue: ${view}`);
    setCurrentView(view);
  }, []);

  const removeNotification = useCallback((id: string) => {
    console.log(`[APP] Suppression notification: ${id}`);
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = { ...notification, id };

    console.log(`[APP] Notification ajoutée: ${notification.type} - ${notification.message}`);
    setNotifications((prev) => [...prev, newNotification]);

    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
  }, [removeNotification]);

  const clearNotifications = useCallback(() => {
    console.log('[APP] Suppression de toutes les notifications');
    setNotifications([]);
  }, []);

  const setAppLoading = useCallback((loading: boolean) => {
    setIsAppLoading(loading);
  }, []);

  const value = {
    currentModal,
    currentView,
    notifications,
    isAppLoading,
    openModal,
    closeModal,
    setView,
    addNotification,
    removeNotification,
    clearNotifications,
    setAppLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
