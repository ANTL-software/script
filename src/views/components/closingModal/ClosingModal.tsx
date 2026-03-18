import './closingModal.scss';
import { FaPhoneAlt, FaCheck, FaSpinner, FaClock, FaStickyNote, FaExclamationTriangle } from 'react-icons/fa';
import { useCallClosing } from '../../../hooks/useCallClosing';
import { STATUT_APPEL_OPTIONS } from '../../../utils/constants';
import { formatDuration } from '../../../utils/scripts/formatters';
import Button from '../button/Button';
import RendezVous from '../rendezVous/RendezVous';

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
  const {
    selectedStatut, setSelectedStatut,
    notes, setNotes,
    isSubmitting, error,
    handleSubmit,
  } = useCallClosing({ prospectId, campagneId, onComplete });

  if (!isOpen) return null;

  return (
    <div className="closing-modal-overlay">
      <div className="closing-modal">

        <div className="closing-modal__header">
          <div className="closing-modal__header-icon">
            <FaPhoneAlt />
          </div>
          <div className="closing-modal__header-content">
            <h2>Résultat de l'appel</h2>
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
          <span>Cette étape est obligatoire. Vous ne pouvez pas continuer sans enregistrer le résultat.</span>
        </div>

        <div className="closing-modal__body">

          <form className="closing-modal__left" onSubmit={handleSubmit}>
            {error && <div className="closing-modal__error">{error}</div>}

            <div className="closing-modal__section">
              <h3>Résultat de l'appel</h3>
              <div className="closing-modal__statut-grid">
                {STATUT_APPEL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`closing-modal__statut-option${selectedStatut === option.value ? ' closing-modal__statut-option--selected' : ''}`}
                    onClick={() => setSelectedStatut(option.value)}
                    disabled={isSubmitting}
                    style={{ '--option-color': option.color } as React.CSSProperties}
                  >
                    <span className="closing-modal__statut-icon">{option.icon}</span>
                    <span className="closing-modal__statut-label">{option.label}</span>
                    <span className="closing-modal__statut-description">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="closing-modal__section">
              <h3><FaStickyNote /> Notes de l'appel</h3>
              <textarea
                className="closing-modal__textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Objections rencontrées, points importants, prochaines étapes..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="closing-modal__footer">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isSubmitting || !selectedStatut}
              >
                {isSubmitting ? (
                  <><FaSpinner className="spinner" /> Enregistrement...</>
                ) : (
                  <><FaCheck /> Valider et continuer</>
                )}
              </Button>
            </div>
          </form>

          <div className="closing-modal__right">
            <RendezVous />
          </div>

        </div>
      </div>
    </div>
  );
}
