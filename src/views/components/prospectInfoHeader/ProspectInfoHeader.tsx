import { useEffect } from 'react';
import './prospectInfoHeader.scss';
import { useSearchParams } from 'react-router-dom';
import { useProspect } from '../../../hooks/useProspect';
import { useDialer } from '../../../hooks/useDialer';
import { useToast } from '../../../hooks/useToast';
import TypeFicheBadge from '../typeFicheBadge/TypeFicheBadge';
import Button from '../button/Button';
import Clock from '../clock/Clock';
import PhoneNumberWithCallButton from '../phoneNumberWithCallButton/PhoneNumberWithCallButton';
import { FaBuilding, FaListOl, FaCommentDots, FaUser, FaPhoneSlash } from 'react-icons/fa';

interface ProspectInfoHeaderProps {
  currentView: 'qui-est-ce' | 'qui-sommes-nous' | 'historique-appels' | 'historique-offres' | 'rendez-vous' | 'commande';
  onQuiEstCe?: () => void;
  onPlanAppels?: () => void;
  onObjections?: () => void;
  onQuiSommesNous?: () => void;
  isTestMode?: boolean;
}

export default function ProspectInfoHeader({ currentView, onQuiEstCe, onPlanAppels, onObjections, onQuiSommesNous, isTestMode = false }: ProspectInfoHeaderProps) {
  const { currentProspect, fullName, typeFiche, appels, loadAppels } = useProspect();
  const { statut, hangup, callFromManual } = useDialer();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (currentProspect) {
      loadAppels().catch(() => {});
    }
  }, [currentProspect, loadAppels]);

  const handleHangup = async () => {
    try {
      await hangup();
    } catch (error) {
      console.error('Erreur lors du raccrochage:', error);
    }
  };

  const isManualSearch = searchParams.get('source') === 'manual';
  const isRappelSource = searchParams.get('source') === 'rappel';
  const rendezVousSourceId = (() => {
    const raw = searchParams.get('rdvId');
    if (!raw) return undefined;
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })();
  const isCalling = statut === 'en_appel' || statut === 'appel_sortant' || statut === 'qualification_en_cours' || statut === 'svi_a_naviguer';

  const handleCallFromManual = async (phoneNumber: string) => {
    if (!currentProspect) return;

    try {
      await callFromManual(phoneNumber, currentProspect.id_prospect, undefined, isRappelSource ? rendezVousSourceId : undefined);
      showToast('info', 'Appel en cours...', 3000);
    } catch (error) {
      console.error('[PROSPECT_INFO_HEADER] Erreur appel manuel:', error);
      showToast('error', 'Erreur lors du lancement de l\'appel', 5000);
    }
  };

  // Toujours afficher le bouton de raccrochage (activé uniquement si en appel)
  const showHangupButton = true;
  const canHangup = statut === 'en_appel' || statut === 'appel_sortant' || statut === 'qualification_en_cours' || statut === 'svi_a_naviguer';

  // Déterminer si le dernier appel terminé (excluant l'appel en cours) était "Commande à établir" (rdv_pris)
  const lastFinishedCall = appels.find(call => call.statut_appel !== 'en_cours');
  const showCommandeBadge = lastFinishedCall?.statut_appel === 'rdv_pris';

  if (!currentProspect) {
    return null;
  }

  return (
    <div className="prospect-info-header">
      <div className="prospect-info-header__top">
        <div className="prospect-info-header__title">
          <h1>{fullName}</h1>
          <TypeFicheBadge typeFiche={typeFiche} />
          {showCommandeBadge && (
            <span className="type-fiche-badge type-fiche-badge--red">
              Commande à établir
            </span>
          )}
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
          {showHangupButton && (
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
          )}
        </div>
      </div>

      {/* Cacher l'encart client dans la view commande pour gagner de la place */}
      {currentView !== 'commande' && (
        <table className="prospect-info-table">
          <tbody>
            <tr>
              <td className="label">Civilite</td>
              <td className="value">{currentProspect.civilite || '-'}</td>
              <td className="label">Nom</td>
              <td className="value">{currentProspect.nom}</td>
            </tr>
            <tr>
              <td className="label">Telephone</td>
              <td className="value">
                <PhoneNumberWithCallButton
                  phoneNumber={currentProspect.telephone}
                  type="principal"
                  onCall={handleCallFromManual}
                  showCallButton={isManualSearch || isRappelSource}
                  isCalling={isCalling}
                />
              </td>
              <td className="label">Tel. contact</td>
              <td className="value">
                <PhoneNumberWithCallButton
                  phoneNumber={currentProspect.telephone_contact || ''}
                  type="contact"
                  onCall={handleCallFromManual}
                  showCallButton={isManualSearch || isRappelSource}
                  disabled={!currentProspect.telephone_contact}
                  isCalling={isCalling}
                />
              </td>
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
