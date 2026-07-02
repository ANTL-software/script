import "./header.scss";

import { useNavigate, useLocation } from "react-router-dom";
import antlLogo from "../../../assets/antlLogo.png";
import { LuLogOut } from "react-icons/lu";
import { FaArrowLeft } from "react-icons/fa";
import { useUser } from "../../../hooks/useUser";
import { useToast } from "../../../hooks/useToast";
import { useClosing } from "../../../hooks/useClosing";
import DialerStatus from "../dialerStatus/DialerStatus";
import DtmfPad from "../dtmfPad/DtmfPad";
import Button from "../button/Button";
import { isTestEnvironment, isProspectTestMode, getCampagneLogoUrl } from "../../../utils/scripts/utils";
import { useCampaign } from "../../../hooks";

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
  const navigate = useNavigate();
  const location = useLocation();
  const showTestBadge = isTestEnvironment() || isProspectTestMode();

  const campaignLogoUrl = getCampagneLogoUrl(currentCampaign?.logo_path);

  // Masquer le bouton de déconnexion sur la vue prospect pour éviter la déconnexion pendant un appel
  // SAUF en mode test (paramètre ?test=true) où on affiche un bouton "Retour" à la place
  // Mais afficher un bouton "Retour" si c'est une recherche manuelle
  const isProspectView = location.pathname.match(/^\/prospect\/\d+$/);
  const searchParams = new URLSearchParams(location.search);
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
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <header>
      <figure className="logo-container">
        <img src={antlLogo} alt="ANTL" className="logo-antl" />
        {campaignLogoUrl && (
          <>
            <span className="logo-separator">/</span>
            <img src={campaignLogoUrl} alt={currentCampaign?.nom_campagne || "Logo Campagne"} className="logo-campaign" />
          </>
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
