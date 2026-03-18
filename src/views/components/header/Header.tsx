import "./header.scss";

import { useNavigate } from "react-router-dom";
import antlLogo from "../../../assets/antlLogo.png";
import { LuLogOut } from "react-icons/lu";
import { useUser } from "../../../hooks/useUser";
import { useToast } from "../../../hooks/useToast";
import { closingService } from "../../../API/services";
import DialerStatus from "../dialerStatus/DialerStatus";

export interface HeaderProps {
  props: {
    pageTitle: string;
  };
}

export default function Header({ props }: HeaderProps) {
  const { pageTitle } = props;
  const { logout, isLoading } = useUser();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Bloquer la deconnexion si un closing est en attente
    if (closingService.hasPending()) {
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

  return (
    <header>
      <figure>
        <img src={antlLogo} alt="ANTL" />
      </figure>
      <h1>{pageTitle ? pageTitle : ""}</h1>
      <div className="header-actions">
        <DialerStatus />
        <button
          className={`logout-btn${isLoading ? " logout-btn--loading" : ""}`}
          onClick={handleLogout}
          disabled={isLoading}
          title="Déconnexion"
          aria-label="Déconnexion"
        >
          <LuLogOut size={18} />
        </button>
      </div>
    </header>
  );
}
