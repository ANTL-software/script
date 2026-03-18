import './actionButtons.scss';
import Button from '../button/Button';
import { FaPhone, FaShoppingCart, FaCreditCard, FaCalendarAlt, FaClone, FaBan } from 'react-icons/fa';

interface ActionButtonsProps {
  currentView: 'qui-est-ce' | 'qui-sommes-nous' | 'historique-appels' | 'historique-offres' | 'rendez-vous' | 'commande';
  onHistoriqueAppels?: () => void;
  onHistoriqueOffres?: () => void;
  onRendezVous?: () => void;
  onCommande?: () => void;
  onDoublon?: () => void;
  onRss?: () => void;
}

export default function ActionButtons({
  currentView,
  onHistoriqueAppels,
  onHistoriqueOffres,
  onRendezVous,
  onCommande,
  onDoublon,
  onRss,
}: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      <div className="action-buttons__group action-buttons__group--left">
        <Button variant="ghost" size="small" onClick={onDoublon}>
          <FaClone /> Doublon
        </Button>
        <Button variant="secondary" size="small" onClick={onRss}>
          <FaBan /> Opt-out
        </Button>
      </div>

      <div className="action-buttons__group action-buttons__group--right">
        <Button
          variant="primary"
          size="small"
          onClick={onHistoriqueAppels}
          disabled={currentView === 'historique-appels'}
          className={currentView === 'historique-appels' ? 'btn-active' : ''}
        >
          <FaPhone /> Historique appels
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={onHistoriqueOffres}
          disabled={currentView === 'historique-offres'}
          className={currentView === 'historique-offres' ? 'btn-active' : ''}
        >
          <FaShoppingCart /> Historique offres
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={onRendezVous}
          disabled={currentView === 'rendez-vous'}
          className={currentView === 'rendez-vous' ? 'btn-active' : ''}
        >
          <FaCalendarAlt /> Rendez-vous
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={onCommande}
          disabled={currentView === 'commande'}
          className={currentView === 'commande' ? 'btn-active' : ''}
        >
          <FaCreditCard /> Commande
        </Button>
      </div>
    </div>
  );
}
