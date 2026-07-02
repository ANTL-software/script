import './historiqueRendezVous.scss';

import { useEffect } from 'react';
import { useProspect } from '../../../hooks/useProspect';
import { useCampaign } from '../../../hooks/useCampaign';
import Loader from '../loader/Loader';
import ErrorMessage from '../errorMessage/ErrorMessage';
import RendezVousCard from './RendezVousCard';

export default function HistoriqueRendezVous() {
  const { currentCampaign } = useCampaign();
  const {
    currentProspect,
    rendezVous,
    rendezVousLoading,
    rendezVousError,
    loadRendezVous,
    clearRendezVousError,
  } = useProspect();

  useEffect(() => {
    if (currentProspect && currentCampaign?.id_campagne) {
      loadRendezVous();
    }
  }, [currentCampaign?.id_campagne, currentProspect, loadRendezVous]);

  if (rendezVousLoading || (currentProspect && !currentCampaign)) {
    return (
      <div className="historique-rendez-vous">
        <div className="historique-rendez-vous__loader">
          <Loader size="large" />
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (rendezVousError) {
    return (
      <div className="historique-rendez-vous">
        <ErrorMessage message={rendezVousError} onClose={clearRendezVousError} />
      </div>
    );
  }

  if (rendezVous.length === 0) {
    return (
      <div className="historique-rendez-vous">
        <div className="historique-rendez-vous__empty">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3>Aucun rendez-vous client enregistre</h3>
          <p>Ce prospect n'a pas encore de rendez-vous rattache a cette campagne.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historique-rendez-vous">
      <div className="historique-rendez-vous__header">
        <h2>Historique des rendez-vous client</h2>
        <span className="historique-rendez-vous__count">
          {rendezVous.length} rendez-vous
        </span>
      </div>

      <div className="historique-rendez-vous__list">
        {rendezVous.map((rdv) => (
          <RendezVousCard key={rdv.id_rendez_vous} rdv={rdv} />
        ))}
      </div>
    </div>
  );
}
