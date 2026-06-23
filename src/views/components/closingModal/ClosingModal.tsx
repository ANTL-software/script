import './closingModal.scss';
import { FaPhoneAlt, FaCheck, FaSpinner, FaClock, FaStickyNote, FaExclamationTriangle, FaMinus } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useCallClosing } from '../../../hooks/useCallClosing';
import { useProspect } from '../../../hooks/useProspect';
import { STATUT_APPEL_OPTIONS } from '../../../utils/constants';
import { formatDuration } from '../../../utils/scripts/formatters';
import Button from '../button/Button';
import AgentCalendar from '../agentCalendar/AgentCalendar';
import ConfirmModal from '../confirmModal/ConfirmModal';
import ProgPA from '../progPA/ProgPA';

interface ClosingModalProps {
  isOpen: boolean;
  prospectId: number;
  prospectName: string;
  campagneId: number;
  appelId?: number;
  origineAppel?: 'auto' | 'manuel' | 'rappel';
  rendezVousSourceId?: number;
  dureeAppel?: number;
  onComplete: () => void;
  forceMode?: boolean;
}

export default function ClosingModal({
  isOpen,
  prospectId,
  prospectName,
  campagneId,
  appelId,
  origineAppel,
  rendezVousSourceId,
  dureeAppel,
  onComplete,
  forceMode = false,
}: ClosingModalProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const { currentProgpa } = useProspect();

  const {
    selectedStatut, setSelectedStatut,
    notes, setNotes,
    isSubmitting, error,
    handleSubmit,
  } = useCallClosing({ prospectId, campagneId, appelId, origineAppel, rendezVousSourceId, onComplete });

  const [showConfirm, setShowConfirm] = useState<'doublon' | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatut === 'doublon') {
      setShowConfirm(selectedStatut);
    } else {
      handleSubmit(e);
    }
  };

  const handleConfirmAction = () => {
    setShowConfirm(null);
    handleSubmit();
  };

  // Forcer la maximisation de la modale si on passe en mode forcé (navigation hors de la fiche)
  useEffect(() => {
    if (forceMode) {
      setIsMinimized(false);
    }
  }, [forceMode]);

  const handleMinimize = () => {
    if (forceMode) return;
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modale complète ou minimisée */}
      {!isMinimized ? (
        <div className="closing-modal-overlay" onClick={forceMode ? undefined : handleMinimize}>
          <div className="closing-modal" onClick={(e) => e.stopPropagation()}>

            <div className="closing-modal__header">
              <button
                className="closing-modal__minimize-btn"
                onClick={handleMinimize}
                title="Réduire la modale"
                disabled={isSubmitting || forceMode}
              >
                <FaMinus />
              </button>
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

              <form className="closing-modal__left" onSubmit={handleFormSubmit}>
                {error && <div className="closing-modal__error">{error}</div>}

                <div className="closing-modal__section">
                  <h3>Résultat de l'appel</h3>
                  <div className="closing-modal__statut-grid">
                    {STATUT_APPEL_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`closing-modal__statut-option${selectedStatut === option.value ? ' closing-modal__statut-option--selected' : ''}`}
                        onClick={() => {
                          if (option.value === 'doublon') {
                            setSelectedStatut('doublon');
                            setShowConfirm('doublon');
                          } else {
                            setSelectedStatut(option.value);
                          }
                        }}
                        disabled={isSubmitting}
                        style={{ '--option-color': option.color } as React.CSSProperties}
                      >
                        <span className="closing-modal__statut-icon">{option.icon}</span>
                        <span className="closing-modal__statut-label">{option.label}</span>
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
                    disabled={isSubmitting || !selectedStatut || currentProgpa === null}
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
                <AgentCalendar
                  prospectId={prospectId}
                  prospectName={prospectName}
                  selectedCallStatus={selectedStatut}
                />
              </div>

              <aside className="closing-modal__aside">
                <div className="closing-modal__progpa-header">
                  <h3>Progression du plan d'appel</h3>
                  <span className={`closing-modal__progpa-status${currentProgpa === null ? ' closing-modal__progpa-status--missing' : ''}`}>
                    {currentProgpa === null ? 'Saisie obligatoire' : `Etape ${currentProgpa}/5`}
                  </span>
                </div>
                <div className="closing-modal__progpa">
                  <ProgPA compact />
                </div>
              </aside>

            </div>
          </div>
        </div>
      ) : (
        <button
          className="closing-modal__restore-btn"
          onClick={handleRestore}
          title="Réafficher la fenêtre de résultat d'appel"
        >
          Saisir le résultat d'appel
        </button>
      )}

      <ConfirmModal
        isOpen={showConfirm !== null}
        type="warning"
        title="Signaler un doublon"
        message="Ce prospect sera marqué comme doublon. Cette action est définitive. Continuer ?"
        confirmText="Signaler doublon"
        isLoading={isSubmitting}
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setShowConfirm(null);
          setSelectedStatut(null);
        }}
      />
    </>
  );
}
