import './prospectInfoHeader.scss';
import { useProspect } from '../../../hooks/useProspect';
import TypeFicheBadge from '../typeFicheBadge/TypeFicheBadge';
import Button from '../button/Button';
import Clock from '../clock/Clock';
import { FaBuilding, FaListOl, FaCommentDots, FaUser } from 'react-icons/fa';

interface ProspectInfoHeaderProps {
  currentView: 'qui-est-ce' | 'qui-sommes-nous' | 'historique-appels' | 'historique-offres' | 'rendez-vous' | 'commande';
  onQuiEstCe?: () => void;
  onPlanAppels?: () => void;
  onObjections?: () => void;
  onQuiSommesNous?: () => void;
}

export default function ProspectInfoHeader({ currentView, onQuiEstCe, onPlanAppels, onObjections, onQuiSommesNous }: ProspectInfoHeaderProps) {
  const { currentProspect, fullName, typeFiche } = useProspect();

  if (!currentProspect) {
    return null;
  }

  return (
    <div className="prospect-info-header">
      <div className="prospect-info-header__top">
        <div className="prospect-info-header__title">
          <h1>{fullName}</h1>
          <TypeFicheBadge typeFiche={typeFiche} />
        </div>
        <div className="prospect-info-header__actions">
          <Button
            variant="tertiary"
            size="small"
            onClick={onQuiEstCe}
            disabled={currentView === 'qui-est-ce'}
            className={currentView === 'qui-est-ce' ? 'btn-active' : ''}
          >
            <FaUser /> Qui est-ce ?
          </Button>
          <Button variant="tertiary" size="small" onClick={onPlanAppels}>
            <FaListOl /> Plan d'appels
          </Button>
          <Button variant="tertiary" size="small" onClick={onObjections}>
            <FaCommentDots /> Objections
          </Button>
          <Button
            variant="tertiary"
            size="small"
            onClick={onQuiSommesNous}
            disabled={currentView === 'qui-sommes-nous'}
            className={currentView === 'qui-sommes-nous' ? 'btn-active' : ''}
          >
            <FaBuilding /> Qui sommes-nous ?
          </Button>
          <Clock />
        </div>
      </div>

      <table className="prospect-info-table">
        <tbody>
          <tr>
            <td className="label">Nom</td>
            <td className="value">{currentProspect.nom}</td>
            <td className="label">Prenom</td>
            <td className="value">{currentProspect.prenom || '-'}</td>
          </tr>
          <tr>
            <td className="label">Telephone</td>
            <td className="value">{currentProspect.telephone}</td>
            <td className="label">Email</td>
            <td className="value">{currentProspect.email || '-'}</td>
          </tr>
          <tr>
            <td className="label">Ville</td>
            <td className="value">{currentProspect.ville || '-'}</td>
            <td className="label">Type</td>
            <td className="value">{currentProspect.type_prospect}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
