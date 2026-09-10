import { useEffect, useRef } from 'react';
import { useToast } from '../../../hooks/index.ts';

export default function ServiceWorkerUpdateNotifier() {
  const { confirm } = useToast();
  const updatePromptedRef = useRef(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || import.meta.env.MODE !== 'production') {
      return undefined;
    }

    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installingWorker: ServiceWorker | null = null;

    const notifyUpdate = async () => {
      if (disposed || updatePromptedRef.current) {
        return;
      }

      updatePromptedRef.current = true;
      const shouldReload = await confirm({
        type: 'info',
        title: 'Mise à jour disponible',
        message: 'Une nouvelle version du Script est disponible. Voulez-vous la charger maintenant ?',
        confirmText: 'Recharger',
        cancelText: 'Plus tard'
      });

      if (shouldReload && !disposed) {
        window.location.reload();
      }
    };

    const handleInstallingWorkerStateChange = () => {
      if (installingWorker?.state === 'installed' && navigator.serviceWorker.controller) {
        void notifyUpdate();
      }
    };

    const handleUpdateFound = () => {
      installingWorker = registration?.installing ?? null;
      installingWorker?.addEventListener('statechange', handleInstallingWorkerStateChange);
    };

    const registerServiceWorker = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js');
        registration.addEventListener('updatefound', handleUpdateFound);
      } catch (registrationError) {
        console.error('SW registration failed:', registrationError);
      }
    };

    void registerServiceWorker();

    return () => {
      disposed = true;
      registration?.removeEventListener('updatefound', handleUpdateFound);
      installingWorker?.removeEventListener('statechange', handleInstallingWorkerStateChange);
    };
  }, [confirm]);

  return null;
}
