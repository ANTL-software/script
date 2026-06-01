import * as Sentry from '@sentry/react';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./views/components/errorBoundary/ErrorBoundary";
// Charger Twilio Voice SDK (définit window.Twilio.Device)
import '@twilio/voice-sdk';

// Enregistrement du Service Worker pour PWA (approche manuelle comme USV)
if ('serviceWorker' in navigator && import.meta.env.MODE === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);

        // Écouter les mises à jour du service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nouvelle version disponible
                if (confirm('Une nouvelle version est disponible. Recharger maintenant ?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.2 : 1.0,
    replaysOnErrorSampleRate: 1.0,
  });
}

import { UserProvider } from "./context/userContext/UserProvider";
import { AppProvider } from "./context/appContext/AppProvider";
import { CampaignProvider } from "./context/campaignContext/CampaignProvider";
import { ProspectProvider } from "./context/prospectContext/ProspectProvider";
import { CartProvider } from "./context/cartContext/CartProvider";
import { ToastProvider } from "./context/toastContext/ToastProvider";
import { DialerProvider } from "./context/dialerContext/DialerProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <UserProvider>
            <DialerProvider>
              <CampaignProvider>
                <ProspectProvider>
                  <CartProvider>
                    <App />
                  </CartProvider>
                </ProspectProvider>
              </CampaignProvider>
            </DialerProvider>
          </UserProvider>
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>
);
