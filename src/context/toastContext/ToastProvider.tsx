import { useState, useCallback, useEffect, useRef } from 'react';
import { ToastContext } from './ToastContext';
import type { Toast, ConfirmOptions, ToastContextType } from './ToastContext';
import ToastContainer from '../../views/components/toast/ToastContainer';
import ConfirmModal from '../../views/components/confirmModal/ConfirmModal';
import { notificationService } from '../../API/services';

interface ToastProviderProps {
  children: React.ReactNode;
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    options: { title: '', message: '' },
  });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const toastIdCounter = useRef(0);

  const showToast = useCallback((type: Toast['type'], message: string, duration = 5000) => {
    const id = `toast-${++toastIdCounter.current}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  useEffect(() => {
    let stopped = false;

    const pollNotifications = async () => {
      const employe = localStorage.getItem('employe');
      if (!employe || stopped) {
        return;
      }

      try {
        const { notifications } = await notificationService.getMyNotifications(false);
        const unreadNotifications = notifications.filter((notification) => !notification.lu);

        for (const notification of unreadNotifications) {
          if (stopped || !notification.message) {
            continue;
          }

          const toastType = notification.type === 'rdv_manque' ? 'warning' : 'info';
          showToast(toastType, notification.message, 8000);
          await notificationService.marquerCommeLue(notification.id_notification);
        }
      } catch {
        // Les notifications ne doivent jamais perturber l'usage principal du script.
      }
    };

    pollNotifications();
    const interval = window.setInterval(pollNotifications, 60000);

    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfirmState({
        isOpen: true,
        options,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const value: ToastContextType = {
    toasts,
    showToast,
    removeToast,
    confirm,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.options.title}
        message={confirmState.options.message}
        type={confirmState.options.type}
        confirmText={confirmState.options.confirmText}
        cancelText={confirmState.options.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ToastContext.Provider>
  );
}
