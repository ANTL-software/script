import './historiqueAppels.scss';

import { useEffect } from 'react';
import { useProspect } from '../../../hooks/useProspect';
import Loader from '../loader/Loader';
import ErrorMessage from '../errorMessage/ErrorMessage';
import AppelCard from './AppelCard';

export default function HistoriqueAppels() {
  const {
    currentProspect,
    appels,
    appelsLoading,
    appelsError,
    appelsPagination,
    loadAppels,
    updateAppelNotes,
    clearAppelsError,
  } = useProspect();

  useEffect(() => {
    if (currentProspect) {
      loadAppels();
    }
  }, [currentProspect, loadAppels]);

  const handlePreviousPage = () => {
    if (appelsPagination.page > 1) {
      loadAppels(appelsPagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (appelsPagination.page < appelsPagination.totalPages) {
      loadAppels(appelsPagination.page + 1);
    }
  };

  const handleUpdateNotes = async (appelId: number, notes: string) => {
    try {
      await updateAppelNotes(appelId, notes);
    } catch {
      // L'erreur est deja geree dans le context
    }
  };

  if (appelsLoading) {
    return (
      <div className="historique-appels">
        <div className="historique-appels__loader">
          <Loader size="large" />
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (appelsError) {
    return (
      <div className="historique-appels">
        <ErrorMessage message={appelsError} onClose={clearAppelsError} />
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
          <h3>Aucun appel enregistre</h3>
          <p>Ce prospect n'a pas encore ete contacte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historique-appels">
      <div className="historique-appels__header">
        <h2>Historique des appels</h2>
        <span className="historique-appels__count">
          {appelsPagination.total} appel{appelsPagination.total > 1 ? 's' : ''}
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

      {appelsPagination.totalPages > 1 && (
        <div className="historique-appels__pagination">
          <button
            className="pagination__btn"
            onClick={handlePreviousPage}
            disabled={appelsPagination.page === 1}
          >
            Precedent
          </button>
          <span className="pagination__info">
            Page {appelsPagination.page} sur {appelsPagination.totalPages}
          </span>
          <button
            className="pagination__btn"
            onClick={handleNextPage}
            disabled={appelsPagination.page === appelsPagination.totalPages}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
