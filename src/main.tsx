import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

import { UserProvider } from "./context/userContext/UserProvider";
import { AppProvider } from "./context/appContext/AppProvider";
import { CampaignProvider } from "./context/campaignContext/CampaignProvider";
import { ProspectProvider } from "./context/prospectContext/ProspectProvider";
import { CartProvider } from "./context/cartContext/CartProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <UserProvider>
        <CampaignProvider>
          <ProspectProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </ProspectProvider>
        </CampaignProvider>
      </UserProvider>
    </AppProvider>
  </StrictMode>
);
