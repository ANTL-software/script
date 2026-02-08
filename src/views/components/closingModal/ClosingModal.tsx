import './closingModal.scss';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { FaPhoneAlt, FaCheck, FaSpinner, FaClock, FaStickyNote, FaExclamationTriangle } from 'react-icons/fa';
import { useUser, useToast } from '../../../hooks';
import { appelService, closingService } from '../../../API/services';
import type { StatutAppel } from '../../../utils/types';
import { STATUT_APPEL_OPTIONS } from '../../../utils/constants';
import { formatDuration, getErrorMessage } from '../../../utils/scripts/formatters';
import Button from '../button/Button';

interface ClosingModalProps {
  isOpen: boolean;
  prospectId: number;
  prospectName: string;
  campagneId: number;
  dureeAppel?: number;
  onComplete: () => void;
}

export default function ClosingModal({
  isOpen,
  prospectId,
  prospectName,
  campagneId,
  dureeAppel,
  onComplete,
}: ClosingModalProps) {
  const { user } = useUser();
  const { showToast } = useToast();

  const [selectedStatut, setSelectedStatut] = useState<StatutAppel | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedStatut) {
      setError('Veuillez selectionner un resultat d\'appel');
      return;
    }

    if (!user) {
      setError('Session expiree, veuillez vous reconnecter');
      return;
    }

    setIsSubmitting(true);

    try {
      await appelService.createAppel({
        id_prospect: prospectId,
        id_campagne: campagneId,
        statut: selectedStatut,
        notes: notes.trim() || undefined,
      });

      closingService.clearPending();
      showToast('success', 'Resultat d\'appel enregistre');
      onComplete();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError(getErrorMessage(err, 'Erreur lors de l\'enregistrement'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="closing-modal-overlay">
      <div className="closing-modal">
        <div className="closing-modal__header">
          <div className="closing-modal__header-icon">
            <FaPhoneAlt />
          </div>
          <div className="closing-modal__header-content">
            <h2>Resultat de l'appel</h2>
            <p className="closing-modal__prospect-name">{prospectName}</p>
          </div>
          {dureeAppel !== undefined && dureeAppel > 0 && (
            <div className="closing-modal__duration">
              <FaClock />
              <span>{formatDuration(dureeAppel)}</span>
            </div>
          )}
        </div>

        <div className="closing-modal__warning">
          <FaExclamationTriangle />
          <span>Cette etape est obligatoire. Vous ne pouvez pas continuer sans enregistrer le resultat.</span>
        </div>

        <form className="closing-modal__form" onSubmit={handleSubmit}>
          {error && (
            <div className="closing-modal__error">
              {error}
            </div>
          )}

          <div className="closing-modal__section">
            <h3>Quel est le resultat de cet appel ?</h3>
            <div className="closing-modal__statut-grid">
              {STATUT_APPEL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`closing-modal__statut-option ${selectedStatut === option.value ? 'closing-modal__statut-option--selected' : ''}`}
                  onClick={() => setSelectedStatut(option.value)}
                  disabled={isSubmitting}
                  style={{
                    '--option-color': option.color,
                  } as React.CSSProperties}
                >
                  <span className="closing-modal__statut-icon">{option.icon}</span>
                  <span className="closing-modal__statut-label">{option.label}</span>
                  <span className="closing-modal__statut-description">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="closing-modal__section">
            <h3>
              <FaStickyNote /> Notes de l'appel
            </h3>
            <textarea
              className="closing-modal__textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajoutez des notes sur cet appel (objections rencontrees, points importants, prochaines etapes...)"
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="closing-modal__footer">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !selectedStatut}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="spinner" /> Enregistrement...
                </>
              ) : (
                <>
                  <FaCheck /> Valider et continuer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
