import './historiqueVentes.scss';

import { useEffect } from 'react';
import { useProspect } from '../../../hooks/useProspect';
import Loader from '../loader/Loader';
import ErrorMessage from '../errorMessage/ErrorMessage';
import VenteCard from './VenteCard';

export default function HistoriqueVentes() {
  const {
    currentProspect,
    ventes,
    ventesLoading,
    ventesError,
    loadVentes,
    clearVentesError,
  } = useProspect();

  useEffect(() => {
    if (currentProspect) {
      loadVentes();
    }
  }, [currentProspect, loadVentes]);

  if (ventesLoading) {
    return (
      <div className="historique-ventes">
        <div className="historique-ventes__loader">
          <Loader size="large" />
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (ventesError) {
    return (
      <div className="historique-ventes">
        <ErrorMessage message={ventesError} onClose={clearVentesError} />
      </div>
    );
  }

  if (ventes.length === 0) {
    return (
      <div className="historique-ventes">
        <div className="historique-ventes__empty">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <h3>Aucune vente enregistree</h3>
          <p>Ce prospect n'a pas encore effectue de commande.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historique-ventes">
      <div className="historique-ventes__header">
        <h2>Historique des ventes</h2>
        <span className="historique-ventes__count">
          {ventes.length} vente{ventes.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="historique-ventes__list">
        {ventes.map((vente) => (
          <VenteCard key={vente.id_vente} vente={vente} />
        ))}
      </div>
    </div>
  );
}
