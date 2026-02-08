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
  onCreate: (data: { date: Date; motif: string; notes: string }) => Promise<void>;
  onUpdate: (data: { date: Date; motif: string; notes: string; statut: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function RendezVousModal({
  isOpen,
  onClose,
  rendezVous,
  initialDate,
  prospectName,
  onCreate,
  onUpdate,
  onDelete,
}: RendezVousModalProps) {
  const isEditMode = !!rendezVous;

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [motif, setMotif] = useState('');
  const [notes, setNotes] = useState('');
  const [statut, setStatut] = useState<RendezVousStatut>('planifie');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      setShowDeleteConfirm(false);
    }
  }, [isOpen, rendezVous, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dateTime = new Date(`${date}T${time}:00`);

    if (!isEditMode && isBefore(dateTime, new Date())) {
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

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await onDelete();
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
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
          <h2>{isEditMode ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</h2>
          <button className="rdv-modal__close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form className="rdv-modal__form" onSubmit={handleSubmit}>
          {displayProspectName && (
            <div className="rdv-modal__prospect">
              <FaUser className="rdv-modal__prospect-icon" />
              <span>{displayProspectName}</span>
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
                min={today}
                required
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
              />
            </div>
          </div>

          <div className="rdv-modal__field">
            <label>Motif du rappel</label>
            <Input
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex: Devis a finaliser, Relance commerciale..."
            />
          </div>

          <div className="rdv-modal__field">
            <label>Notes</label>
            <textarea
              className="rdv-modal__textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes supplementaires..."
              rows={3}
            />
          </div>

          {isEditMode && (
            <div className="rdv-modal__field">
              <label>Statut</label>
              <select
                className="rdv-modal__select"
                value={statut}
                onChange={(e) => setStatut(e.target.value as RendezVousStatut)}
              >
                {STATUT_RENDEZ_VOUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="rdv-modal__actions">
            {isEditMode && !showDeleteConfirm && (
              <Button
                type="button"
                variant="danger"
                size="small"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                <FaTrash /> Supprimer
              </Button>
            )}

            {showDeleteConfirm && (
              <div className="rdv-modal__delete-confirm">
                <span>Confirmer la suppression ?</span>
                <Button
                  type="button"
                  variant="danger"
                  size="small"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  Oui, supprimer
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="small"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
              </div>
            )}

            <div className="rdv-modal__actions-right">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enregistrement...' : isEditMode ? 'Modifier' : 'Creer'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
