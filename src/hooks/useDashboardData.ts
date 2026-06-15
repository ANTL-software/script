import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './useUser';
import { prospectService, rendezVousService, statsService, notificationService } from '../API/services';
import type { RendezVous, StatsDuJour, Notification } from '../utils/types';

const DASHBOARD_POLL_INTERVAL = 60_000;

export function useDashboardData() {
  const { user } = useUser();
  const navigate = useNavigate();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [rdvDuJour, setRdvDuJour] = useState<RendezVous[]>([]);
  const [rdvLoading, setRdvLoading] = useState(true);

  const [stats, setStats] = useState<StatsDuJour | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nonLues, setNonLues] = useState(0);
  const [notifsLoading, setNotifsLoading] = useState(true);



  const fetchData = useCallback(async () => {
    if (!user) return;

    setRdvLoading(true);
    setStatsLoading(true);
    setNotifsLoading(true);

    const [rdvResult, statsResult, notifsResult] = await Promise.allSettled([
      rendezVousService.getRendezVousToday(user.id_employe),
      statsService.getMyStatsDuJour(),
      notificationService.getMyNotifications(false),
    ]);

    if (rdvResult.status === 'fulfilled') setRdvDuJour(rdvResult.value);
    setRdvLoading(false);

    if (statsResult.status === 'fulfilled') setStats(statsResult.value);
    setStatsLoading(false);

    if (notifsResult.status === 'fulfilled') {
      setNotifications(notifsResult.value.notifications);
      setNonLues(notifsResult.value.non_lues);
    }
    setNotifsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user) return;
    pollRef.current = setInterval(fetchData, DASHBOARD_POLL_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchData().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, fetchData]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      // Nettoyer tous les séparateurs courants avant envoi (le backend normalise le reste)
      const cleaned = searchQuery.trim().replace(/[\s\-().]/g, '');
      const isPhone = /^[+\d]{6,}$/.test(cleaned);
      if (isPhone) {
        const prospectModel = await prospectService.getProspectByPhone(cleaned);
        // Ajouter le paramètre ?source=manual pour distinguer les recherches manuelles
        navigate(`/prospect/${prospectModel.toJSON().id_prospect}?source=manual`);
      } else {
        setSearchError('Recherche par nom non disponible pour le moment. Saisissez un numéro de téléphone.');
      }
    } catch (error: any) {
      // Gestion améliorée des erreurs avec message plus explicite
      const errorMessage = error?.message || 'Erreur lors de la recherche';
      if (errorMessage.includes('Aucun prospect trouvé') || errorMessage.includes('not found')) {
        setSearchError('Aucune fiche trouvée pour ce numéro.');
      } else {
        setSearchError('Aucune fiche trouvée pour ce numéro.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleMarquerLue = async (id: number) => {
    try {
      await notificationService.marquerCommeLue(id);
      setNotifications(prev => prev.filter(n => n.id_notification !== id));
      setNonLues(prev => Math.max(0, prev - 1));
    } catch {
      // silencieux
    }
  };

  const handleMarquerToutLu = async () => {
    try {
      await notificationService.marquerToutCommeLu();
      setNotifications([]);
      setNonLues(0);
    } catch {
      // silencieux
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    isSearching,
    searchError,
    rdvDuJour,
    rdvLoading,
    stats,
    statsLoading,
    notifications,
    nonLues,
    notifsLoading,
    refreshDashboardData: fetchData,
    handleSearch,
    handleMarquerLue,
    handleMarquerToutLu,
  };
}
