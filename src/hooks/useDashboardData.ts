import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './useUser';
import { prospectService, rendezVousService, statsService, notificationService } from '../API/services';
import type { RendezVous, StatsDuJour, Notification } from '../utils/types';

const NOTIFS_POLL_INTERVAL = 60_000;

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

  const fetchNotifications = useCallback(async () => {
    try {
      const result = await notificationService.getMyNotifications(false);
      setNotifications(result.notifications);
      setNonLues(result.non_lues);
    } catch {
      // silencieux — on réessaie au prochain tick
    }
  }, []);

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
    pollRef.current = setInterval(fetchNotifications, NOTIFS_POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, fetchNotifications]);

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
        navigate(`/prospect/${prospectModel.toJSON().id_prospect}`);
      } else {
        setSearchError('Recherche par nom non disponible pour le moment. Saisissez un numéro de téléphone.');
      }
    } catch {
      setSearchError('Aucun prospect trouvé pour ce numéro.');
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
    handleSearch,
    handleMarquerLue,
    handleMarquerToutLu,
  };
}
