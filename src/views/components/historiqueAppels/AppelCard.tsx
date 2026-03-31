import './appelCard.scss';

import { useState } from 'react';
import type { Appel } from '../../../utils/types';

interface AppelCardProps {
  appel: Appel;
  onUpdateNotes: (appelId: number, notes: string) => Promise<void>;
}

export default function AppelCard({ appel, onUpdateNotes }: AppelCardProps) {
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(appel.notes || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getStatutClass = (statut: string): string => {
    switch (statut) {
      case 'abouti':
      case 'vente_conclue':
      case 'rdv_pris':
        return 'appel-card__statut--success';
      case 'non_abouti':
      case 'pas_de_reponse':
      case 'occupe':
      case 'messagerie':
        return 'appel-card__statut--warning';
      case 'refus_definitif':
        return 'appel-card__statut--danger';
      default:
        return '';
    }
  };

  const getStatutLabel = (statut: string): string => {
    const labels: Record<string, string> = {
      abouti: 'Abouti',
      non_abouti: 'Non abouti',
      occupe: 'Occupé',
      pas_de_reponse: 'Pas de réponse',
      messagerie: 'Messagerie',
      rdv_pris: 'RDV pris',
      vente_conclue: 'Vente conclue',
      refus_definitif: 'Refus définitif',
    };
    return labels[statut] || statut;
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await onUpdateNotes(appel.id_appel, notes);
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setNotes(appel.notes || '');
    setIsEditingNotes(false);
  };

  return (
    <div className="appel-card">
      <div className="appel-card__header">
        <div className="appel-card__date-time">
          <span className="appel-card__date">{formatDate(appel.created_at)}</span>
          <span className="appel-card__time">{formatTime(appel.created_at)}</span>
        </div>
        <span className={`appel-card__statut ${getStatutClass(appel.statut_appel)}`}>
          {getStatutLabel(appel.statut_appel)}
        </span>
      </div>

      <div className="appel-card__body">
        <div className="appel-card__info">
          <div className="appel-card__info-item">
            <span className="info-label">Durée:</span>
            <span className="info-value">{formatDuration(appel.duree_secondes ?? null)}</span>
          </div>
          {appel.Employe && (
            <div className="appel-card__info-item">
              <span className="info-label">Agent:</span>
              <span className="info-value">
                {appel.Employe.prenom} {appel.Employe.nom}
              </span>
            </div>
          )}
        </div>

        <div className="appel-card__notes">
          <div className="appel-card__notes-header">
            <span className="info-label">Notes:</span>
            {!isEditingNotes && (
              <button
                className="appel-card__edit-btn"
                onClick={() => setIsEditingNotes(true)}
              >
                ✏️ Modifier
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <div className="appel-card__notes-edit">
              <textarea
                className="appel-card__notes-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajouter des notes sur cet appel..."
                rows={4}
              />
              <div className="appel-card__notes-actions">
                <button
                  className="notes-action-btn notes-action-btn--cancel"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Annuler
                </button>
                <button
                  className="notes-action-btn notes-action-btn--save"
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                >
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          ) : (
            <p className="appel-card__notes-text">
              {appel.notes || <em>Aucune note</em>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
