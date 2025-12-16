import './actionButtons.scss';
import Button from '../button/Button';
import { FaUser, FaBuilding, FaPhone, FaShoppingCart, FaInfoCircle, FaCreditCard } from 'react-icons/fa';

interface ActionButtonsProps {
  onInformationProspect?: () => void;
  onQuiEstCe?: () => void;
  onQuiSommesNous?: () => void;
  onHistoriqueAppels?: () => void;
  onHistoriqueOffres?: () => void;
  onCommande?: () => void;
}

export default function ActionButtons({
  onInformationProspect,
  onQuiEstCe,
  onQuiSommesNous,
  onHistoriqueAppels,
  onHistoriqueOffres,
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
        <Button variant="primary" size="small" onClick={onHistoriqueAppels}>
          <FaPhone /> Historique appels
        </Button>
        <Button variant="primary" size="small" onClick={onHistoriqueOffres}>
          <FaShoppingCart /> Historique offres
        </Button>
        <Button variant="primary" size="small" onClick={onCommande}>
          <FaCreditCard /> Commande
        </Button>
      </div>
    </div>
  );
}
