import './rendezVousModal.scss';
import { useState, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaClock, FaTrash, FaUser } from 'react-icons/fa';
import { format, isBefore, startOfDay } from 'date-fns';
import type { RendezVous, RendezVousStatut } from '../../../utils/types';
import { STATUT_RENDEZ_VOUS_OPTIONS } from '../../../utils/constants';
import { formatProspectName } from '../../../utils/scripts/formatters';
import Button from '../button/Button';
import Input from '../input/Input';

interface RendezVousModalProps {
  isOpen: boolean;
  onClose: () => void;
  rendezVous: RendezVous | null;
  initialDate?: Date;
  prospectName?: string;
  isReadOnly?: boolean;
  onCreate: (data: { date: Date; motif: string; notes: string }) => Promise<void>;
  onUpdate: (data: { date: Date; motif: string; notes: string; statut: string }) => Promise<void>;
  onRequestDelete?: () => void;
  showToast?: (type: 'success' | 'error', message: string) => void;
}

export default function RendezVousModal({
  isOpen,
  onClose,
  rendezVous,
  initialDate,
  prospectName,
  isReadOnly = false,
  onCreate,
  onUpdate,
  onRequestDelete,
  showToast,
}: RendezVousModalProps) {
  const isEditMode = !!rendezVous;

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [motif, setMotif] = useState('');
  const [notes, setNotes] = useState('');
  const [statut, setStatut] = useState<RendezVousStatut>('planifie');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (rendezVous) {
        setDate(rendezVous.date_rdv);
        setTime(rendezVous.heure_rdv.substring(0, 5));
        setMotif(rendezVous.motif || '');
        setNotes(rendezVous.notes || '');
        setStatut(rendezVous.statut);
      } else if (initialDate) {
        setDate(format(initialDate, 'yyyy-MM-dd'));
        setTime(format(initialDate, 'HH:mm'));
        setMotif('');
        setNotes('');
        setStatut('planifie');
      }
    }
  }, [isOpen, rendezVous, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !time) {
      showToast?.('error', 'Veuillez sélectionner une date et une heure');
      return;
    }

    const dateTime = new Date(`${date}T${time}:00`);
    
    if (isNaN(dateTime.getTime())) {
      showToast?.('error', 'Date ou heure invalide');
      return;
    }

    if (!isEditMode && isBefore(dateTime, new Date())) {
      showToast?.('error', 'Impossible de créer un rendez-vous dans le passé');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        await onUpdate({ date: dateTime, motif, notes, statut });
      } else {
        await onCreate({ date: dateTime, motif, notes });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');

  const displayProspectName = rendezVous?.prospect
    ? formatProspectName(rendezVous.prospect)
    : prospectName;

  return (
    <div className="rdv-modal-overlay" onClick={onClose}>
      <div className="rdv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rdv-modal__header">
          <h2>
            {isReadOnly ? 'Rendez-vous (autre agent)' : isEditMode ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
          </h2>
          <button className="rdv-modal__close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form className="rdv-modal__form" onSubmit={handleSubmit}>
          {displayProspectName && (
            <div className={`rdv-modal__prospect${isReadOnly ? ' rdv-modal__prospect--autre-agent' : ''}`}>
              <FaUser className="rdv-modal__prospect-icon" />
              <span>{displayProspectName}</span>
              {isReadOnly && <span className="rdv-modal__prospect-badge">Autre agent</span>}
            </div>
          )}

          <div className="rdv-modal__row">
            <div className="rdv-modal__field">
              <label>
                <FaCalendarAlt /> Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={isReadOnly ? undefined : today}
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="rdv-modal__field">
              <label>
                <FaClock /> Heure
              </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="rdv-modal__field">
            <label>Motif du rappel</label>
            <Input
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex: Devis à finaliser, Relance commerciale..."
              disabled={isReadOnly}
            />
          </div>

          <div className="rdv-modal__field">
            <label>Notes</label>
            <textarea
              className="rdv-modal__textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes supplémentaires..."
              rows={3}
              disabled={isReadOnly}
            />
          </div>

          {isEditMode && (
            <div className="rdv-modal__field">
              <label>Statut</label>
              <select
                className="rdv-modal__select"
                value={statut}
                onChange={(e) => setStatut(e.target.value as RendezVousStatut)}
                disabled={isReadOnly}
              >
                {STATUT_RENDEZ_VOUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isReadOnly ? (
            <div className="rdv-modal__actions">
              <div className="rdv-modal__actions-right">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Fermer
                </Button>
              </div>
            </div>
          ) : (
            <div className="rdv-modal__actions">
              {isEditMode && onRequestDelete && (
                <Button
                  type="button"
                  variant="danger"
                  size="small"
                  onClick={onRequestDelete}
                  disabled={isSubmitting}
                >
                  <FaTrash /> Supprimer
                </Button>
              )}

              <div className="rdv-modal__actions-right">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : isEditMode ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
