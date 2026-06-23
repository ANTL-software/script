import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { closingService, type PendingClosing } from '../API/services';
import { useDialer } from './useDialer';

interface UseForceClosingResult {
  pendingClosing: PendingClosing | null;
  forceMode: boolean;
}

export function useForceClosing(): UseForceClosingResult {
  const location = useLocation();
  const { statut } = useDialer();
  const [pendingClosing, setPendingClosing] = useState<PendingClosing | null>(() =>
    closingService.getPending()
  );

  useEffect(() => {
    const handleClosingChange = () => {
      setPendingClosing(closingService.getPending());
    };

    window.addEventListener('antl_closing_changed', handleClosingChange);
    window.addEventListener('storage', handleClosingChange);

    return () => {
      window.removeEventListener('antl_closing_changed', handleClosingChange);
      window.removeEventListener('storage', handleClosingChange);
    };
  }, []);

  // Exclure les routes utilitaires et la connexion
  const isExcludedRoute = ['/login', '/objections', '/plan-appel'].includes(location.pathname);
  if (isExcludedRoute) {
    return { pendingClosing: null, forceMode: false };
  }

  // Ne pas afficher de modale pendant un appel actif (statut dialer en cours d'appel)
  if (statut === 'en_appel' || statut === 'appel_sortant' || statut === 'qualification_en_cours' || statut === 'svi_a_naviguer') {
    return { pendingClosing: null, forceMode: false };
  }

  if (!pendingClosing) {
    return { pendingClosing: null, forceMode: false };
  }

  // Vérifier si on est sur la fiche prospect concernée
  const isOnProspectPage = location.pathname.match(/^\/prospect\/\d+$/);
  const isCorrectProspect = isOnProspectPage &&
    location.pathname === `/prospect/${pendingClosing.prospectId}`;

  // Force mode = true si on N'est PAS sur la bonne fiche prospect
  const forceMode = !isCorrectProspect;

  return { pendingClosing, forceMode };
}
