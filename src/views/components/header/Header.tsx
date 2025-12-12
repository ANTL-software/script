import "./header.scss";

import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../hooks/useUser";
import { useClock } from "../../../utils/scripts/utils";
import Button from "../button/Button";

export interface HeaderProps {
  props: {
    pageTitle: string;
  };
}

export default function Header({ props }: HeaderProps): ReactElement {
  const { pageTitle } = props;
  const currentTime = useClock();
  const { logout, isLoading } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
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
        <img alt="ANTL" />
      </figure>
      <h1>{pageTitle ? pageTitle : ""}</h1>
      <div className="header-actions">
        <Button
          variant="ghost"
          size="small"
          onClick={handleLogout}
          isLoading={isLoading}
          className="logout-button"
        >
          Déconnexion
        </Button>
        <p className="clock">{currentTime}</p>
      </div>
    </header>
  );
}
