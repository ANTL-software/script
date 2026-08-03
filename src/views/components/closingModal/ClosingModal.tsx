import './closingModal.scss';
import { FaPhoneAlt, FaCheck, FaSpinner, FaClock, FaStickyNote, FaExclamationTriangle, FaMinus } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import { useCallClosing, useProspect } from '../../../hooks/index.ts';
import type { CampaignVariant } from '../../../utils/scripts/index.ts';
import { CAMPAIGN_VARIANTS, formatDuration, getCampaignClosingOptions } from '../../../utils/scripts/index.ts';
import { Button } from '../button/index.ts';
import { AgentCalendar } from '../agentCalendar/index.ts';
import { ConfirmModal } from '../confirmModal/index.ts';
import { ProgPA } from '../progPA/index.ts';

interface ClosingModalProps {
  isOpen: boolean;
  prospectId: number;
  prospectName: string;
  campagneId: number;
  campaignVariant?: CampaignVariant | null;
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
  campaignVariant = null,
  appelId,
  origineAppel,
  rendezVousSourceId,
  dureeAppel,
  onComplete,
  forceMode = false,
}: ClosingModalProps) {
  const closingOptions = getCampaignClosingOptions(
    campaignVariant ? { type_campagne: campaignVariant } : null,
  );
  const isLeadB2B = campaignVariant === CAMPAIGN_VARIANTS.lead_b2b;
  const [isMinimized, setIsMinimized] = useState(false);
  const { currentProgpa, setCurrentProgpa } = useProspect();
  const unlockedProgpaBeforeVenteRef = useRef<number | null | undefined>(undefined);

  const {
    selectedStatut, setSelectedStatut,
    notes, setNotes,
    isSubmitting, error,
    commercialFollowup,
    commercialFollowupPresentation,
    handleSubmit,
  } = useCallClosing({ prospectId, campagneId, appelId, origineAppel, rendezVousSourceId, campaignVariant, dureeAppel, onComplete });

  const [showConfirm, setShowConfirm] = useState<'doublon' | null>(null);
  const isVenteConclue = selectedStatut === 'vente_conclue';
  const isLeadValidated = isLeadB2B && selectedStatut === 'rendez_vous_pris';
  const isAutoProgpaLockedStatus = isVenteConclue || isLeadValidated;
  const isCommercialFollowupLocked = commercialFollowup !== null;
  const isProgpaLocked = isAutoProgpaLockedStatus || isCommercialFollowupLocked;

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
    if (isCommercialFollowupLocked) {
      if (currentProgpa !== null) {
        setCurrentProgpa(null);
      }
      unlockedProgpaBeforeVenteRef.current = undefined;
      return;
    }

    if (forceMode) {
      queueMicrotask(() => setIsMinimized(false));
    }
  }, [forceMode]);

  useEffect(() => {
    if (isAutoProgpaLockedStatus) {
      if (currentProgpa !== 5) {
        unlockedProgpaBeforeVenteRef.current = currentProgpa;
        setCurrentProgpa(5);
      }
      return;
    }

    if (unlockedProgpaBeforeVenteRef.current !== undefined) {
      setCurrentProgpa(unlockedProgpaBeforeVenteRef.current);
      unlockedProgpaBeforeVenteRef.current = undefined;
    }
  }, [currentProgpa, isAutoProgpaLockedStatus, isCommercialFollowupLocked, setCurrentProgpa]);

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
                    {closingOptions.map((option) => (
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
                    disabled={isSubmitting || !selectedStatut || (!isProgpaLocked && currentProgpa === null)}
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
                  campagneId={campagneId}
                  selectedCallStatus={selectedStatut}
                  isReadOnly={isAutoProgpaLockedStatus}
                />
              </div>

              <aside className="closing-modal__aside">
                <div className="closing-modal__progpa-header">
                  <h3>Progression du plan d'appel</h3>
                  <span className={`closing-modal__progpa-status${!isProgpaLocked && currentProgpa === null ? ' closing-modal__progpa-status--missing' : ''}`}>
                    {commercialFollowupPresentation?.badge ?? (isAutoProgpaLockedStatus ? 'Auto 5/5' : (currentProgpa === null ? 'Saisie obligatoire' : `Etape ${currentProgpa}/5`))}
                  </span>
                </div>
                {commercialFollowupPresentation && (
                  <p className="closing-modal__progpa-auto-note closing-modal__progpa-auto-note--followup">
                    {commercialFollowupPresentation.note}
                  </p>
                )}
                {isVenteConclue && (
                  <p className="closing-modal__progpa-auto-note">
                    Vente conclue : relance automatique à +10 min, ProgPA verrouillé à 5.
                  </p>
                )}
                {isLeadValidated && (
                  <p className="closing-modal__progpa-auto-note">
                    Rendez-vous valide : la fiche est consideree comme finalisee pour cette etape, ProgPA verrouille a 5.
                  </p>
                )}
                {isLeadB2B && !isAutoProgpaLockedStatus && (
                  <p className="closing-modal__progpa-auto-note">
                    Variante MMA : le statut Relance reutilise la mecanique historique de commande a etablir pour poser un rappel agenda avant validation.
                  </p>
                )}
                <div className="closing-modal__progpa">
                  <ProgPA
                    compact
                    disabled={isProgpaLocked}
                    campaignVariant={campaignVariant}
                    commercialFollowup={commercialFollowup}
                  />
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
