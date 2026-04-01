import * as Sentry from '@sentry/react';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./views/components/errorBoundary/ErrorBoundary";

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
    <AppProvider>
      <UserProvider>
        <DialerProvider>
          <CampaignProvider>
            <ProspectProvider>
              <CartProvider>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </CartProvider>
            </ProspectProvider>
          </CampaignProvider>
        </DialerProvider>
      </UserProvider>
    </AppProvider>
    </ErrorBoundary>
  </StrictMode>
);
