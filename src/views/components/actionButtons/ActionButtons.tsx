import './actionButtons.scss';
import Button from '../button/Button';
import { FaUser, FaBuilding, FaPhone, FaShoppingCart, FaInfoCircle, FaCreditCard, FaCalendarAlt } from 'react-icons/fa';

interface ActionButtonsProps {
  currentView: 'default' | 'historique-appels' | 'historique-offres' | 'rendez-vous' | 'commande';
  onInformationProspect?: () => void;
  onQuiEstCe?: () => void;
  onQuiSommesNous?: () => void;
  onHistoriqueAppels?: () => void;
  onHistoriqueOffres?: () => void;
  onRendezVous?: () => void;
  onCommande?: () => void;
}

export default function ActionButtons({
  currentView,
  onInformationProspect,
  onQuiEstCe,
  onQuiSommesNous,
  onHistoriqueAppels,
  onHistoriqueOffres,
  onRendezVous,
  onCommande,
}: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      <div className="action-buttons__group">
        <Button variant="secondary" size="small" onClick={onInformationProspect}>
          <FaInfoCircle /> Information prospect
        </Button>
        <Button variant="secondary" size="small" onClick={onQuiEstCe}>
          <FaUser /> Qui est-ce ?
        </Button>
        <Button variant="secondary" size="small" onClick={onQuiSommesNous}>
          <FaBuilding /> Qui sommes-nous ?
        </Button>
      </div>

      <div className="action-buttons__group">
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
