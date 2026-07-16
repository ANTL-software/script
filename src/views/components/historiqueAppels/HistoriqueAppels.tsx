import './historiqueAppels.scss';

import { useEffect } from 'react';
import { useCallNotesDraft, useCampaign, useDialer, useProspect } from '../../../hooks/index.ts';
import { Loader } from '../loader/index.ts';
import { ErrorMessage } from '../errorMessage/index.ts';
import AppelCard from './AppelCard';
import { CAMPAIGN_VARIANTS, formatDateTime, getCampaignVariant } from '../../../utils/scripts/index.ts';

export default function HistoriqueAppels() {
  const {
    currentProspect,
    appels,
    appelsLoading,
    appelsError,
    appelsPagination,
    loadAppels,
    clearAppelsError,
  } = useProspect();
  const { currentCampaign } = useCampaign();
  const { currentAppelId, currentOrigineAppel, statut } = useDialer();
  const { notes: callNotes, setNotes: setCallNotes } = useCallNotesDraft(currentAppelId);

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

  const grilleTarifaireEnvoyeeAt = currentProspect?.grille_tarifaire_envoyee_at ?? null;
  const isSalesCampaign = getCampaignVariant(currentCampaign) === CAMPAIGN_VARIANTS.vente;
  const isLiveCall = statut === 'appel_sortant'
    || statut === 'en_appel'
    || statut === 'qualification_en_cours'
    || statut === 'svi_a_naviguer';
  const canDraftCurrentCallNotes = currentAppelId !== null
    && isLiveCall
    && (currentOrigineAppel === 'auto' || currentOrigineAppel === 'rappel');
  const grilleTarifaireLabel = grilleTarifaireEnvoyeeAt
    ? `Grille tarifaire envoyee le ${formatDateTime(grilleTarifaireEnvoyeeAt)}`
    : 'Grille tarifaire non envoyee';

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

  return (
    <div className="historique-appels">
      <div className="historique-appels__header">
        <h2>Historique des appels</h2>
        <div className="historique-appels__header-meta">
          {isSalesCampaign && (
            <span className={`historique-appels__tarifs ${grilleTarifaireEnvoyeeAt ? 'historique-appels__tarifs--sent' : 'historique-appels__tarifs--pending'}`}>
              {grilleTarifaireLabel}
            </span>
          )}
          <span className="historique-appels__count">
            {appelsPagination.total} appel{appelsPagination.total > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {canDraftCurrentCallNotes && (
        <div className="historique-appels__current-call-notes">
          <label htmlFor="current-call-notes">Notes de l'appel en cours</label>
          <textarea
            id="current-call-notes"
            value={callNotes}
            onChange={(event) => setCallNotes(event.target.value)}
            placeholder="Commencez le traçage pendant l'appel : objections, informations et prochaines étapes..."
            rows={5}
          />
          <p>Ce commentaire sera repris dans la modale de closing.</p>
        </div>
      )}

      <div className="historique-appels__list">
        {appels.length === 0 ? (
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
        ) : appels.map((appel) => (
          <AppelCard key={appel.id_appel} appel={appel} />
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
