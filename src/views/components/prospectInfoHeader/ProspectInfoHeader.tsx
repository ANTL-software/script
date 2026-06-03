import './prospectInfoHeader.scss';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProspect } from '../../../hooks/useProspect';
import { useDialer } from '../../../hooks/useDialer';
import TypeFicheBadge from '../typeFicheBadge/TypeFicheBadge';
import Button from '../button/Button';
import Clock from '../clock/Clock';
import { FaBuilding, FaListOl, FaCommentDots, FaUser, FaPhoneSlash, FaArrowLeft } from 'react-icons/fa';

interface ProspectInfoHeaderProps {
  currentView: 'qui-est-ce' | 'qui-sommes-nous' | 'historique-appels' | 'historique-offres' | 'rendez-vous' | 'commande';
  onQuiEstCe?: () => void;
  onPlanAppels?: () => void;
  onObjections?: () => void;
  onQuiSommesNous?: () => void;
  isTestMode?: boolean;
}

export default function ProspectInfoHeader({ currentView, onQuiEstCe, onPlanAppels, onObjections, onQuiSommesNous, isTestMode = false }: ProspectInfoHeaderProps) {
  const { currentProspect, fullName, typeFiche } = useProspect();
  const { statut, hangup } = useDialer();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isManualSearch = searchParams.get('source') === 'manual';

  const handleHangup = async () => {
    try {
      await hangup();
    } catch (error) {
      console.error('Erreur lors du raccrochage:', error);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Toujours afficher le bouton de raccrochage (activé uniquement si en appel)
  const showHangupButton = true;
  const canHangup = statut === 'en_appel' || statut === 'appel_sortant';

  if (!currentProspect) {
    return null;
  }

  return (
    <div className="prospect-info-header">
      <div className="prospect-info-header__top">
        <div className="prospect-info-header__title">
          <h1>{fullName}</h1>
          <TypeFicheBadge typeFiche={typeFiche} />
          {isTestMode && (
            <span className="test-mode-badge">MODE TEST</span>
          )}
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
          {isManualSearch ? (
            <Button
              variant="secondary"
              size="small"
              onClick={handleBack}
              className="back-button"
              title="Retour à l'accueil"
            >
              <FaArrowLeft /> Retour
            </Button>
          ) : (
            showHangupButton && (
              <Button
                variant="danger"
                size="small"
                onClick={handleHangup}
                className="hangup-button"
                title="Raccrocher"
                disabled={!canHangup}
              >
                <FaPhoneSlash />
              </Button>
            )
          )}
        </div>
      </div>

      {/* Cacher l'encart client dans la view commande pour gagner de la place */}
      {currentView !== 'commande' && (
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
      )}
    </div>
  );
}
