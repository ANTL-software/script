import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertContext } from './AlertContext';
import type { ShowAlertOptions } from './AlertContext';
import Alert from '../../views/components/alert/Alert';
import type { AlertProps } from '../../views/components/alert/Alert';

interface AlertProviderProps {
  children: ReactNode;
}

interface ActiveAlert extends Omit<AlertProps, 'onConfirm' | 'onCancel' | 'onClose'> {
  resolve: (value: boolean) => void;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);

  const removeAlert = useCallback((id: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  }, []);

  const showAlert = useCallback((options: ShowAlertOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

      setAlerts((current) => [
        ...current,
        {
          id,
          type: options.type,
          title: options.title,
          message: options.message,
          autoClose: options.autoClose,
          confirmText: options.confirmText,
          cancelText: options.cancelText,
          resolve
        }
      ]);
    });
  }, []);

  const showWarning = useCallback((message: string, title = 'Attention', autoClose = 9000) => {
    return showAlert({
      type: 'warning',
      title,
      message,
      autoClose
    });
  }, [showAlert]);

  const handleConfirm = useCallback((id: string) => {
    const alert = alerts.find((item) => item.id === id);
    if (!alert) {
      return;
    }

    alert.resolve(true);
    removeAlert(id);
  }, [alerts, removeAlert]);

  const handleCancel = useCallback((id: string) => {
    const alert = alerts.find((item) => item.id === id);
    if (!alert) {
      return;
    }

    alert.resolve(false);
    removeAlert(id);
  }, [alerts, removeAlert]);

  const handleClose = useCallback((id: string) => {
    const alert = alerts.find((item) => item.id === id);
    if (!alert) {
      return;
    }

    alert.resolve(alert.type !== 'confirm');
    removeAlert(id);
  }, [alerts, removeAlert]);

  const contextValue = useMemo(() => ({
    showAlert,
    showWarning
  }), [showAlert, showWarning]);

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          id={alert.id}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          autoClose={alert.autoClose}
          confirmText={alert.confirmText}
          cancelText={alert.cancelText}
          onConfirm={() => handleConfirm(alert.id)}
          onCancel={() => handleCancel(alert.id)}
          onClose={() => handleClose(alert.id)}
        />
      ))}
    </AlertContext.Provider>
  );
}
