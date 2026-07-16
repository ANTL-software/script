import "./header.scss";

import antlLogo from "../../../assets/antlLogo.png";
import { LuLogOut } from "react-icons/lu";
import { FaArrowLeft } from "react-icons/fa";
import { useCampaign, useClosing, useNavigation, useToast, useUser } from '../../../hooks/index.ts';
import { DialerStatus } from '../dialerStatus/index.ts';
import { DtmfPad } from '../dtmfPad/index.ts';
import { Button } from '../button/index.ts';
import { getCampagneLogoUrl, isProspectTestMode, isTestEnvironment } from '../../../utils/scripts/index.ts';

export interface HeaderProps {
  props: {
    pageTitle: string;
  };
}

export default function Header({ props }: HeaderProps) {
  const { pageTitle } = props;
  const { logout, isLoading } = useUser();
  const { showToast } = useToast();
  const { hasPending } = useClosing();
  const { currentCampaign } = useCampaign();
  const { navigateTo, pathname, searchParams } = useNavigation();
  const showTestBadge = isTestEnvironment() || isProspectTestMode();

  const campaignLogoUrl = getCampagneLogoUrl(currentCampaign?.logo_path);

  // Masquer le bouton de déconnexion sur la vue prospect pour éviter la déconnexion pendant un appel
  // SAUF en mode test (paramètre ?test=true) où on affiche un bouton "Retour" à la place
  // Mais afficher un bouton "Retour" si c'est une recherche manuelle
  const isProspectView = pathname.match(/^\/prospect\/\d+$/);
  const isTestMode = searchParams.get('test') === 'true';
  const isManualSearch = searchParams.get('source') === 'manual';
  const isRappelSource = searchParams.get('source') === 'rappel';
  const shouldShowLogout = !isProspectView || (!isTestMode && !isManualSearch && !isRappelSource);
  const shouldShowBack = isProspectView && (isManualSearch || isTestMode || isRappelSource);

  const handleLogout = async () => {
    // Bloquer la déconnexion si un closing est en attente
    if (hasPending()) {
      showToast('error', 'Veuillez d\'abord enregistrer le resultat de l\'appel');
      return;
    }

    try {
      await logout();
      navigateTo('/login', { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleBack = () => {
    navigateTo('/');
  };

  return (
    <header>
      <figure className="logo-container">
        <img src={antlLogo} alt="ANTL" className="logo-antl" />
        {campaignLogoUrl && (
          <img src={campaignLogoUrl} alt={currentCampaign?.nom_campagne || "Logo Campagne"} className="logo-campaign" />
        )}
      </figure>
      <h1 className="header-title">
        <span>{pageTitle ? pageTitle : ""}</span>
        {showTestBadge && <span className="env-badge env-badge--test">TEST</span>}
      </h1>
      <div className="header-actions">
        <DialerStatus />
        <DtmfPad />
        {shouldShowBack ? (
          <Button
            variant="secondary"
            size="small"
            onClick={handleBack}
            className="header-back-btn"
            title="Retour à l'accueil"
          >
            <FaArrowLeft /> Retour
          </Button>
        ) : shouldShowLogout && (
          <button
            className={`logout-btn${isLoading ? " logout-btn--loading" : ""}`}
            onClick={handleLogout}
            disabled={isLoading}
            title="Déconnexion"
            aria-label="Déconnexion"
          >
            <LuLogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
