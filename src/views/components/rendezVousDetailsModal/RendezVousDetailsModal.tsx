import './rendezVousDetailsModal.scss';
import { FaTimes, FaCalendarAlt, FaClock, FaUser, FaPhone, FaEdit, FaTrash } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { RendezVous } from '../../../utils/types';
import { formatProspectName, formatHeure, checkIsCommande } from '../../../utils/scripts/formatters';
import Button from '../button/Button';
import { useNavigate } from 'react-router-dom';

interface RendezVousDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rendezVous: RendezVous | null;
  onEdit: () => void;
  onDelete: () => void;
  showMonterFiche?: boolean;
}

const STATUT_LABELS: Record<string, string> = {
  planifie: 'Planifié',
  effectue: 'Effectué',
  reporte: 'Reporté',
  annule: 'Annulé',
};

const STATUT_COLORS: Record<string, string> = {
  planifie: '#3b82f6',
  effectue: '#10b981',
  reporte: '#f59e0b',
  annule: '#ef4444',
};

export default function RendezVousDetailsModal({
  isOpen,
  onClose,
  rendezVous,
  onEdit,
  onDelete,
  showMonterFiche = false,
}: RendezVousDetailsModalProps) {
  const navigate = useNavigate();

  if (!isOpen || !rendezVous) return null;

  const prospect = rendezVous.prospect;

  const handleMonterFiche = () => {
    if (prospect) {
      onClose();
      navigate(`/prospect/${prospect.id_prospect}?source=rappel&rdvId=${rendezVous.id_rendez_vous}`);
    }
  };
  const isCommande = checkIsCommande(rendezVous.motif, rendezVous.appelsSource);
  const statut = rendezVous.statut;
  const statutLabel = isCommande ? 'Commande à établir' : (STATUT_LABELS[statut] ?? statut);
  const statutColor = isCommande ? '#E95420' : (STATUT_COLORS[statut] ?? '#6b7280');

  const rdvDate = parseISO(rendezVous.date_rdv);
  const formattedDate = format(rdvDate, 'EEEE d MMMM yyyy', { locale: fr });
  const formattedTime = formatHeure(rendezVous.heure_rdv);

  return (
    <div className="rdv-details-modal-overlay" onClick={onClose}>
      <div className="rdv-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rdv-details-modal__header">
          <div className="rdv-details-modal__header-left">
            <h2>Détails du rendez-vous</h2>
            {showMonterFiche && prospect && (
              <Button
                variant="primary"
                size="small"
                onClick={handleMonterFiche}
                className="rdv-details-modal__monter-btn"
              >
                Monter la fiche
              </Button>
            )}
          </div>
          <button className="rdv-details-modal__close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="rdv-details-modal__content">
          {/* Statut badge */}
          <div className="rdv-details-modal__statut-badge" style={{ backgroundColor: statutColor }}>
            {statutLabel}
          </div>

          {/* Date et heure */}
          <div className="rdv-details-modal__section">
            <h3 className="rdv-details-modal__section-title">
              <FaCalendarAlt /> Date et heure
            </h3>
            <div className="rdv-details-modal__datetime">
              <div className="rdv-details-modal__date-item">
                <FaClock className="rdv-details-modal__icon" />
                <span className="rdv-details-modal__date-value">
                  {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
                </span>
              </div>
              <div className="rdv-details-modal__date-item">
                <FaClock className="rdv-details-modal__icon" />
                <span className="rdv-details-modal__time-value">{formattedTime}</span>
              </div>
            </div>
          </div>

          {/* Prospect */}
          {prospect && (
            <div className="rdv-details-modal__section">
              <h3 className="rdv-details-modal__section-title">
                <FaUser /> Prospect
              </h3>
              <div className="rdv-details-modal__prospect-card">
                <div className="rdv-details-modal__prospect-name">
                  {formatProspectName(prospect)}
                </div>
                {prospect.telephone && (
                  <div className="rdv-details-modal__prospect-phone">
                    <FaPhone className="rdv-details-modal__phone-icon" />
                    <span className="rdv-details-modal__phone-number">{prospect.telephone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Motif */}
          {rendezVous.motif && (
            <div className="rdv-details-modal__section">
              <h3 className="rdv-details-modal__section-title">Motif du rappel</h3>
              <p className="rdv-details-modal__text">{rendezVous.motif}</p>
            </div>
          )}

          {/* Notes */}
          {rendezVous.notes && (
            <div className="rdv-details-modal__section">
              <h3 className="rdv-details-modal__section-title">Notes</h3>
              <p className="rdv-details-modal__text rdv-details-modal__notes">{rendezVous.notes}</p>
            </div>
          )}
        </div>

        <div className="rdv-details-modal__actions">
          <Button variant="danger" onClick={onDelete}>
            <FaTrash /> Supprimer
          </Button>
          <Button variant="secondary" onClick={onEdit}>
            <FaEdit /> Modifier
          </Button>
        </div>
      </div>
    </div>
  );
}
