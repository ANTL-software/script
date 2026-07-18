import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildDashboardRendezVousItems,
  resolveAssignedProspectAction,
} from '../utils/scripts/index.ts';
import { useCampaign } from './useCampaign.ts';
import { useDashboardData } from './useDashboardData.ts';
import { useDialer } from './useDialer.ts';
import { useNavigation } from './useNavigation.ts';
import { useToast } from './useToast.ts';

const QUEUE_POLL_INTERVAL = 15_000;
const TEST_PROSPECT_URL = '/prospect/1?test=true';

interface NetworkConnection {
  effectiveType?: string;
  addEventListener?(event: string, listener: () => void): void;
  removeEventListener?(event: string, listener: () => void): void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection;
  mozConnection?: NetworkConnection;
  webkitConnection?: NetworkConnection;
}

function useRuntimeCampaignSynchronization(): void {
  const { currentCampagneId } = useDialer();
  const { loadCampaign, clearCampaign } = useCampaign();

  useEffect(() => {
    if (!currentCampagneId) {
      clearCampaign();
      return;
    }

    loadCampaign(currentCampagneId).catch((error: unknown) => {
      console.error('[DASHBOARD] Erreur synchronisation campagne runtime:', error);
    });
  }, [clearCampaign, currentCampagneId, loadCampaign]);
}

function useNetworkQualityWarning(): void {
  const { showToast } = useToast();
  const warningShown = useRef(false);

  useEffect(() => {
    const browserNavigator = navigator as NavigatorWithConnection;
    const connection = browserNavigator.connection
      ?? browserNavigator.mozConnection
      ?? browserNavigator.webkitConnection;
    if (!connection) return;

    const checkConnection = (): void => {
      const isWeakConnection = connection.effectiveType === 'slow-2g'
        || connection.effectiveType === '2g';

      if (isWeakConnection && !warningShown.current) {
        showToast('warning', 'Connexion internet faible — Qualité audio risque d\'être dégradée', 7000);
        warningShown.current = true;
      } else if (!isWeakConnection) {
        warningShown.current = false;
      }
    };

    checkConnection();
    connection.addEventListener?.('change', checkConnection);

    return () => {
      connection.removeEventListener?.('change', checkConnection);
    };
  }, [showToast]);
}

function useDashboardQueue(): void {
  const { navigateTo } = useNavigation();
  const {
    statut,
    prochainProspect,
    clearProchainProspect,
    call,
    requestNextProspect,
  } = useDialer();

  useEffect(() => {
    if (!prochainProspect) return;

    const {
      id_prospect,
      telephone,
      id_campagne_assignee,
      distribution_mode,
      id_rendez_vous_source,
    } = prochainProspect;

    const action = resolveAssignedProspectAction(
      id_prospect,
      distribution_mode,
      id_rendez_vous_source,
    );

    clearProchainProspect();
    navigateTo(action.url);

    if (action.shouldStartCall) {
      void call(telephone, id_campagne_assignee ?? undefined, id_prospect);
    }
  }, [call, clearProchainProspect, navigateTo, prochainProspect]);

  useEffect(() => {
    if (statut !== 'disponible' || prochainProspect) return;

    void requestNextProspect({ showEmptyToast: false }).catch(() => {});
    const intervalId = window.setInterval(() => {
      void requestNextProspect({ showEmptyToast: false }).catch(() => {});
    }, QUEUE_POLL_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [prochainProspect, requestNextProspect, statut]);
}

export function useDashboardPage() {
  useRuntimeCampaignSynchronization();
  useNetworkQualityWarning();
  useDashboardQueue();

  const { navigateTo } = useNavigation();
  const { currentCampagneId } = useDialer();
  const { showToast } = useToast();
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const nextRendezVousRef = useRef<HTMLLIElement>(null);
  const {
    searchQuery,
    setSearchQuery,
    isSearching,
    searchError,
    rdvDuJour,
    rdvLoading,
    stats,
    statsLoading,
    handleSearch,
  } = useDashboardData();

  const rendezVousItems = useMemo(
    () => buildDashboardRendezVousItems(rdvDuJour),
    [rdvDuJour],
  );
  const nextRendezVousId = rendezVousItems.find((item) => item.isNext)?.rendezVous.id_rendez_vous ?? null;

  useEffect(() => {
    if (!nextRendezVousId) return;
    nextRendezVousRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [nextRendezVousId]);

  const openCalendar = useCallback((): void => {
    setIsCalendarModalOpen(true);
  }, []);

  const closeCalendar = useCallback((): void => {
    setIsCalendarModalOpen(false);
  }, []);

  const openRendezVous = useCallback((url: string | null): void => {
    if (url) navigateTo(url);
  }, [navigateTo]);

  const openTestProspect = useCallback((): void => {
    if (!currentCampagneId) {
      showToast('warning', 'Chargement de votre campagne en cours. Reessayez dans un instant.');
      return;
    }

    navigateTo(TEST_PROSPECT_URL);
  }, [currentCampagneId, navigateTo, showToast]);

  return {
    searchQuery,
    setSearchQuery,
    isSearching,
    searchError,
    rendezVousItems,
    rdvLoading,
    stats,
    statsLoading,
    handleSearch,
    isCalendarModalOpen,
    openCalendar,
    closeCalendar,
    openRendezVous,
    openTestProspect,
    nextRendezVousRef,
    isTestProspectDisabled: !currentCampagneId,
    testProspectTitle: currentCampagneId
      ? 'Ouvrir la fiche de formation dans votre campagne active'
      : 'Chargement de la campagne active',
  };
}
