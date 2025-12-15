import './actionButtons.scss';
import Button from '../button/Button';
import { FaUser, FaBuilding, FaPhone, FaShoppingCart } from 'react-icons/fa';

interface ActionButtonsProps {
  onQuiEstCe?: () => void;
  onQuiSommesNous?: () => void;
  onHistoriqueAppels?: () => void;
  onHistoriqueOffres?: () => void;
}

export default function ActionButtons({
  onQuiEstCe,
  onQuiSommesNous,
  onHistoriqueAppels,
  onHistoriqueOffres,
}: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      <div className="action-buttons__group">
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
      </div>
    </div>
  );
}
