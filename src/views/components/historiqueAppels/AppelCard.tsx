import './appelCard.scss';

import { useState } from 'react';
import type { Appel } from '../../../utils/types';
import { formatDateShort, formatTime, formatDurationFromSeconds, getStatutAppelClass, getStatutAppelLabel } from '../../../utils/scripts/formatters';

interface AppelCardProps {
  appel: Appel;
  onUpdateNotes: (appelId: number, notes: string) => Promise<void>;
}

export default function AppelCard({ appel, onUpdateNotes }: AppelCardProps) {
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(appel.notes || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

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
          <span className="appel-card__date">{formatDateShort(appel.created_at)}</span>
          <span className="appel-card__time">{formatTime(appel.created_at)}</span>
        </div>
        <span className={`appel-card__statut ${getStatutAppelClass(appel.statut_appel)}`}>
          {getStatutAppelLabel(appel.statut_appel)}
        </span>
      </div>

      <div className="appel-card__body">
        <div className="appel-card__info">
          <div className="appel-card__info-item">
            <span className="info-label">Durée:</span>
            <span className="info-value">{formatDurationFromSeconds(appel.duree_secondes ?? null)}</span>
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
