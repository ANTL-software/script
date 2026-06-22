import './landingPage.scss';
import { useParams, useSearchParams } from 'react-router-dom';
import { useLandingPage, useProspect } from '../../../hooks';
import { closingService } from '../../../API/services';
import ProspectInfoHeader from '../../components/prospectInfoHeader/ProspectInfoHeader';
import ActionButtons from '../../components/actionButtons/ActionButtons';
import Loader from '../../components/loader/Loader';
import ErrorMessage from '../../components/errorMessage/ErrorMessage';
import QuiEstCe from '../../components/quiEstCe/QuiEstCe';
import QuiSommesNous from '../../components/quiSommesNous/QuiSommesNous';
import HistoriqueAppels from '../../components/historiqueAppels/HistoriqueAppels';
import HistoriqueVentes from '../../components/historiqueVentes/HistoriqueVentes';
import AgentCalendar from '../../components/agentCalendar/AgentCalendar';
import CatalogueProduits from '../../components/catalogueProduits/CatalogueProduits';
import Panier from '../../components/panier/Panier';
import ProgPA from '../../components/progPA/ProgPA';
import ConfirmOrderModal from '../../components/confirmOrderModal/ConfirmOrderModal';
import { useEffect } from 'react';
import { useToast } from '../../../hooks/useToast';
import { prospectService } from '../../../API/services/Prospect.service';

export default function LandingPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { fullName: prospectFullName } = useProspect();
  const { showToast, confirm } = useToast();

  // Mode test : détecter le paramètre ?test=true
  const isTestMode = searchParams.get('test') === 'true';

  const {
    currentProspect, currentView, isLoading, error, clearError,
    isModalOpen, setIsModalOpen,
    handlePlanAppels, handleObjections, handleCommande,
    handleOrderSuccess,
    setView, currentCampaign,
  } = useLandingPage(id, isTestMode);

  // DEBUG : Permettre de tester la closing modal via URL ?test=closing
  useEffect(() => {
    if (searchParams.get('test') === 'closing' && currentProspect && currentCampaign && !closingService.hasPending()) {
      const testData = {
        prospectId: currentProspect.id_prospect,
        prospectName: `${currentProspect.nom} ${currentProspect.prenom || ''}`.trim(),
        campagneId: currentCampaign.id_campagne,
        dureeAppel: 45,
      };
      closingService.savePending(testData);
      console.log('[DEBUG] Closing modal test activé via URL');
      // Nettoyer le paramètre URL pour éviter les déclenchements répétés
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, currentProspect, currentCampaign]);

  useEffect(() => {
    const isAutoReminder = searchParams.get('autoReminder') === '1';
    const isRappelSource = searchParams.get('source') === 'rappel';

    if (!isAutoReminder || !isRappelSource || !currentProspect) {
      return;
    }

    showToast('info', 'Rappel rendez-vous');
    setView('historique-appels');

    const nextUrl = `${window.location.pathname}?source=rappel&rdvId=${searchParams.get('rdvId') ?? ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [currentProspect, searchParams, showToast, setView]);

  const handleSendCatalogue = async () => {
    if (!currentProspect) {
      showToast('error', 'Aucun prospect chargé');
      return;
    }

    if (!currentProspect.email) {
      showToast('warning', 'Le prospect n\'a pas d\'adresse email renseignee');
      return;
    }

    try {
      const result = await prospectService.sendCatalogue(currentProspect.id_prospect);
      showToast('success', `Catalogue envoyé à ${result.recipientEmail}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'envoi du catalogue';
      showToast('error', message);
    }
  };

  const handleTarifsClick = async () => {
    const recipientEmail = currentProspect?.email?.trim();
    const confirmed = await confirm({
      title: 'Envoi du catalogue',
      message: recipientEmail
        ? `Êtes-vous sûr de vouloir envoyer le catalogue par mail à ${recipientEmail} ?`
        : 'Êtes-vous sûr de vouloir envoyer le catalogue par mail ?',
      type: 'info',
      confirmText: 'Envoyer',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;
    await handleSendCatalogue();
  };

  const handleAgrementClick = async () => {
    const recipientEmail = currentProspect?.email?.trim();
    const confirmed = await confirm({
      title: 'Envoi de l\'agrément',
      message: recipientEmail
        ? `Êtes-vous sûr de vouloir envoyer l\'agrément par mail à ${recipientEmail} ?`
        : 'Êtes-vous sûr de vouloir envoyer l\'agrément par mail ?',
      type: 'info',
      confirmText: 'Envoyer',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;
    showToast('warning', 'Aucun document d\'agrément n\'est encore configuré pour cet envoi');
  };

  if (isLoading) {
    return (
      <main id="landingPage">
        <div className="landing-page__loader">
          <Loader size="large" />
          <p>Chargement du prospect...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main id="landingPage">
        <div className="landing-page__error">
          <ErrorMessage message={error} onClose={clearError} />
        </div>
      </main>
    );
  }

  if (!currentProspect) {
    return (
      <main id="landingPage">
        <div className="landing-page__empty">
          <p>Aucun prospect chargé</p>
        </div>
      </main>
    );
  }

  return (
    <main id="landingPage">
      <ProspectInfoHeader
        currentView={currentView}
        onQuiEstCe={() => setView('qui-est-ce')}
        onPlanAppels={handlePlanAppels}
        onObjections={handleObjections}
        onQuiSommesNous={() => setView('qui-sommes-nous')}
        isTestMode={isTestMode}
      />

      <div className="landing-page__workspace">
        <div className="landing-page__main">
          <ActionButtons
            currentView={currentView}
            onTarifs={handleTarifsClick}
            onAgrement={handleAgrementClick}
            onHistoriqueAppels={() => setView('historique-appels')}
            onHistoriqueOffres={() => setView('historique-offres')}
            onRendezVous={() => setView('rendez-vous')}
            onCommande={handleCommande}
          />

          <div className={`landing-page__content ${currentView === 'commande' ? 'view-commande' : ''}`}>
            {currentView === 'qui-est-ce' && <QuiEstCe />}
            {currentView === 'qui-sommes-nous' && <QuiSommesNous />}
            {currentView === 'historique-appels' && <HistoriqueAppels />}
            {currentView === 'historique-offres' && <HistoriqueVentes />}
            {currentView === 'rendez-vous' && (
              <AgentCalendar
                prospectId={currentProspect.id_prospect}
                prospectName={prospectFullName}
              />
            )}
            {currentView === 'commande' && (
              <div className="landing-page__commande">
                <div className="landing-page__catalogue">
                  <CatalogueProduits />
                </div>
                <div className="landing-page__panier">
                  <Panier onValidateOrder={() => setIsModalOpen(true)} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="landing-page__gauge">
          <ProgPA />
        </div>
      </div>

      <ConfirmOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleOrderSuccess}
      />
    </main>
  );
}
