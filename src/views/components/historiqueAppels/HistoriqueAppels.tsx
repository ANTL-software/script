import './historiqueAppels.scss';

import { useState, useEffect, useCallback } from 'react';
import { appelService } from '../../../API/services';
import { useProspect } from '../../../hooks/useProspect';
import type { Appel } from '../../../utils/types';
import Loader from '../loader/Loader';
import ErrorMessage from '../errorMessage/ErrorMessage';
import AppelCard from './AppelCard';

export default function HistoriqueAppels() {
  const { currentProspect } = useProspect();
  const [appels, setAppels] = useState<Appel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const limit = 20;

  const loadAppels = useCallback(async () => {
    if (!currentProspect) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await appelService.getAppelsByProspect(
        currentProspect.id_prospect,
        { page, limit }
      );

      setAppels(response.appels);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des appels');
    } finally {
      setIsLoading(false);
    }
  }, [currentProspect, page]);

  useEffect(() => {
    loadAppels();
  }, [loadAppels]);

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handleUpdateNotes = async (appelId: number, notes: string) => {
    try {
      await appelService.updateAppel(appelId, { notes });
      // Recharger la liste après modification
      await loadAppels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour des notes');
    }
  };

  if (isLoading) {
    return (
      <div className="historique-appels">
        <div className="historique-appels__loader">
          <Loader size="large" />
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="historique-appels">
        <ErrorMessage message={error} onClose={() => setError(null)} />
      </div>
    );
  }

  if (appels.length === 0) {
    return (
      <div className="historique-appels">
        <div className="historique-appels__empty">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <h3>Aucun appel enregistré</h3>
          <p>Ce prospect n'a pas encore été contacté.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historique-appels">
      <div className="historique-appels__header">
        <h2>Historique des appels</h2>
        <span className="historique-appels__count">
          {total} appel{total > 1 ? 's' : ''}
        </span>
      </div>

      <div className="historique-appels__list">
        {appels.map((appel) => (
          <AppelCard
            key={appel.id_appel}
            appel={appel}
            onUpdateNotes={handleUpdateNotes}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="historique-appels__pagination">
          <button
            className="pagination__btn"
            onClick={handlePreviousPage}
            disabled={page === 1}
          >
            ← Précédent
          </button>
          <span className="pagination__info">
            Page {page} sur {totalPages}
          </span>
          <button
            className="pagination__btn"
            onClick={handleNextPage}
            disabled={page === totalPages}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
