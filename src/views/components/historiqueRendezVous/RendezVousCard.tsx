import { useState } from 'react';
import type { LeadClient } from '../../../utils/types';
import { mapRendezVousToHistoryCardModel } from '../../../utils/scripts/rendezVousHistory';

interface RendezVousCardProps {
  rdv: LeadClient;
}

const getStatutClass = (statut: string): string => {
  switch (statut) {
    case 'planifie':
      return 'rendez-vous-card__statut--planifie';
    case 'reporte':
      return 'rendez-vous-card__statut--reporte';
    case 'effectue':
      return 'rendez-vous-card__statut--effectue';
    case 'annule':
      return 'rendez-vous-card__statut--annule';
    case 'non_honore':
      return 'rendez-vous-card__statut--non-honore';
    default:
      return '';
  }
};

export default function RendezVousCard({ rdv }: RendezVousCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const card = mapRendezVousToHistoryCardModel(rdv);

  const toggleExpanded = () => {
    setIsExpanded((current) => !current);
  };

  return (
    <div className="rendez-vous-card">
      <div
        className="rendez-vous-card__header"
        onClick={toggleExpanded}
        style={{ cursor: 'pointer' }}
      >
        <div className="rendez-vous-card__info">
          <div className="rendez-vous-card__date-statut">
            <span className="rendez-vous-card__date">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {new Date(card.date).toLocaleDateString('fr-FR')} à {card.heure}
            </span>
            <span className={`rendez-vous-card__statut ${getStatutClass(card.statut)}`}>
              {card.statutLabel}
            </span>
          </div>
          <div className="rendez-vous-card__client-final">
            <span className="client-label">Campagne :</span>
            <span className="client-value">{card.campagneLabel}</span>
          </div>
        </div>

        <button
          className={`rendez-vous-card__toggle ${isExpanded ? 'rendez-vous-card__toggle--expanded' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            toggleExpanded();
          }}
        >
          {isExpanded ? '▼ Masquer details' : '▶ Voir details'}
        </button>
      </div>

      {isExpanded && (
        <div className="rendez-vous-card__details">
          <div className="rendez-vous-card__grid">
            <div className="rendez-vous-card__meta-block">
              <h5>Interlocuteur qualifie</h5>
              <p>{card.interlocuteurNom}</p>
              {card.interlocuteurRole && (
                <span style={{ fontSize: '0.8rem', color: '#666' }}>{card.interlocuteurRole}</span>
              )}
            </div>

            <div className="rendez-vous-card__meta-block">
              <h5>Coordonnees directes</h5>
              {card.telephone ? (
                <a href={`tel:${card.telephone}`} className="meta-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {card.telephone}
                </a>
              ) : (
                <p>Aucun telephone direct</p>
              )}

              {card.email ? (
                <a href={`mailto:${card.email}`} className="meta-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  {card.email}
                </a>
              ) : (
                <p>Aucun email direct</p>
              )}
            </div>
          </div>

          {card.motif && (
            <div className="rendez-vous-card__notes-block">
              <h5>Motif du rendez-vous</h5>
              <p>{card.motif}</p>
            </div>
          )}

          {card.notesPlanification && (
            <div className="rendez-vous-card__notes-block">
              <h5>Notes de planification</h5>
              <p>{card.notesPlanification}</p>
            </div>
          )}

          {card.closingNotes && (
            <div className="rendez-vous-card__notes-block">
              <h5>Derniere note de closing</h5>
              <p>{card.closingNotes}</p>
            </div>
          )}

          <div className="rendez-vous-card__footer-info">
            <span className="agent-info">
              Rendez-vous fixe par l'agent : <strong>{card.agentLabel}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
