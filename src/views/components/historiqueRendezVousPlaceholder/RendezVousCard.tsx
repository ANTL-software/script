import { useState } from 'react';

export interface RendezVousClient {
  id: number;
  date: string;
  heure: string;
  statut: 'confirme' | 'qualifie' | 'annule' | 'effectue';
  interlocuteur: {
    nom: string;
    role: string;
  };
  coordonnees: {
    telephone: string;
    email: string;
  };
  agent: string;
  notes: string;
  clientFinal: string;
}

interface RendezVousCardProps {
  rdv: RendezVousClient;
}

export default function RendezVousCard({ rdv }: RendezVousCardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatutClass = (statut: string): string => {
    switch (statut) {
      case 'confirme':
        return 'rendez-vous-card__statut--confirme';
      case 'qualifie':
        return 'rendez-vous-card__statut--qualifie';
      case 'effectue':
        return 'rendez-vous-card__statut--effectue';
      case 'annule':
        return 'rendez-vous-card__statut--annule';
      default:
        return '';
    }
  };

  const getStatutLabel = (statut: string): string => {
    const labels: Record<string, string> = {
      confirme: 'Confirmé',
      qualifie: 'Qualifié (Lead)',
      effectue: 'Effectué',
      annule: 'Annulé',
    };
    return labels[statut] || statut;
  };

  const formatAgentName = (name: string): string => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].toLowerCase();
    }
    const firstName = parts[0].toLowerCase();
    const lastName = parts.slice(1).join(' ').toUpperCase();
    return `${firstName} ${lastName}`;
  };

  return (
    <div className="rendez-vous-card">
      <div 
        className="rendez-vous-card__header" 
        onClick={() => setIsExpanded(!isExpanded)}
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
              {formatDate(rdv.date)} à {rdv.heure}
            </span>
            <span className={`rendez-vous-card__statut ${getStatutClass(rdv.statut)}`}>
              {getStatutLabel(rdv.statut)}
            </span>
          </div>
          <div className="rendez-vous-card__client-final">
            <span className="client-label">Destinataire final :</span>
            <span className="client-value">{rdv.clientFinal}</span>
          </div>
        </div>

        <button
          className={`rendez-vous-card__toggle ${isExpanded ? 'rendez-vous-card__toggle--expanded' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? '▼ Masquer détails' : '▶ Voir détails'}
        </button>
      </div>

      {isExpanded && (
        <div className="rendez-vous-card__details">
          <div className="rendez-vous-card__grid">
            <div className="rendez-vous-card__meta-block">
              <h5>Interlocuteur Qualifié</h5>
              <p>{rdv.interlocuteur.nom}</p>
              <span style={{ fontSize: '0.8rem', color: '#666' }}>{rdv.interlocuteur.role}</span>
            </div>

            <div className="rendez-vous-card__meta-block">
              <h5>Coordonnées Directes</h5>
              <a href={`tel:${rdv.coordonnees.telephone}`} className="meta-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {rdv.coordonnees.telephone}
              </a>
              <a href={`mailto:${rdv.coordonnees.email}`} className="meta-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {rdv.coordonnees.email}
              </a>
            </div>
          </div>

          <div className="rendez-vous-card__notes-block">
            <h5>Notes & Informations de Qualification</h5>
            <p>{rdv.notes}</p>
          </div>

          <div className="rendez-vous-card__footer-info">
            <span className="agent-info">
              Rendez-vous fixé par l'agent : <strong>{formatAgentName(rdv.agent)}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
