import './historiqueVentes.scss';

import { useState, useEffect, useCallback } from 'react';
import { venteService } from '../../../API/services';
import { useProspect } from '../../../hooks/useProspect';
import type { Vente } from '../../../utils/types';
import Loader from '../loader/Loader';
import ErrorMessage from '../errorMessage/ErrorMessage';
import VenteCard from './VenteCard';

export default function HistoriqueVentes() {
  const { currentProspect } = useProspect();
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadVentes = useCallback(async () => {
    if (!currentProspect) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await venteService.getVentesByProspect(currentProspect.id_prospect);

      setVentes(response.ventes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des ventes');
    } finally {
      setIsLoading(false);
    }
  }, [currentProspect]);

  useEffect(() => {
    loadVentes();
  }, [loadVentes]);

  if (isLoading) {
    return (
      <div className="historique-ventes">
        <div className="historique-ventes__loader">
          <Loader size="large" />
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="historique-ventes">
        <ErrorMessage message={error} onClose={() => setError(null)} />
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
          <h3>Aucune vente enregistrée</h3>
          <p>Ce prospect n'a pas encore effectué de commande.</p>
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
