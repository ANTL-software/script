import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

import { UserProvider } from "./context/userContext/UserProvider";
import { AppProvider } from "./context/appContext/AppProvider";
import { CampaignProvider } from "./context/campaignContext/CampaignProvider";
import { ProspectProvider } from "./context/prospectContext/ProspectProvider";
import { CartProvider } from "./context/cartContext/CartProvider";
import { ToastProvider } from "./context/toastContext/ToastProvider";
import { DialerProvider } from "./context/dialerContext/DialerProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
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
  </StrictMode>
);
