import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { closingService, type PendingClosing } from '../API/services';

interface UseForceClosingResult {
  pendingClosing: PendingClosing | null;
  forceMode: boolean;
}

export function useForceClosing(): UseForceClosingResult {
  const location = useLocation();

  const result = useMemo(() => {
    const pendingClosing = closingService.getPending();

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
  }, [location.pathname]);

  return result;
}
