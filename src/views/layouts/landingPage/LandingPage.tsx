import './landingPage.scss';
import { useParams, useSearchParams } from 'react-router-dom';
import { useLandingPage, useForceClosing } from '../../../hooks';
import ProspectInfoHeader from '../../components/prospectInfoHeader/ProspectInfoHeader';
import ActionButtons from '../../components/actionButtons/ActionButtons';
import Loader from '../../components/loader/Loader';
import ErrorMessage from '../../components/errorMessage/ErrorMessage';
import QuiEstCe from '../../components/quiEstCe/QuiEstCe';
import QuiSommesNous from '../../components/quiSommesNous/QuiSommesNous';
import HistoriqueAppels from '../../components/historiqueAppels/HistoriqueAppels';
import HistoriqueVentes from '../../components/historiqueVentes/HistoriqueVentes';
import RendezVous from '../../components/rendezVous/RendezVous';
import CatalogueProduits from '../../components/catalogueProduits/CatalogueProduits';
import Panier from '../../components/panier/Panier';
import ConfirmOrderModal from '../../components/confirmOrderModal/ConfirmOrderModal';
import ClosingModal from '../../components/closingModal/ClosingModal';
import ConfirmModal from '../../components/confirmModal/ConfirmModal';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { forceMode } = useForceClosing();

  // Mode test : détecter le paramètre ?test=true
  const isTestMode = searchParams.get('test') === 'true';

  const {
    currentProspect, currentView, isLoading, error, clearError,
    isModalOpen, setIsModalOpen, pendingClosing,
    confirmModal, setConfirmModal,
    handlePlanAppels, handleObjections, handleCommande,
    handleDoublon, handleRss, handleConfirmAction,
    handleOrderSuccess, handleClosingComplete,
    setView, currentCampaign,
  } = useLandingPage(id, isTestMode);

  // DEBUG : Permettre de tester la closing modal via URL ?test=closing
  const [testClosing, setTestClosing] = useState<typeof pendingClosing | null>(null);

  useEffect(() => {
    if (searchParams.get('test') === 'closing' && currentProspect && currentCampaign && !pendingClosing) {
      const testData = {
        prospectId: currentProspect.id_prospect,
        prospectName: `${currentProspect.nom} ${currentProspect.prenom || ''}`.trim(),
        campagneId: currentCampaign.id_campagne,
        dureeAppel: 45,
        timestamp: Date.now(),
      };
      setTestClosing(testData as unknown as typeof pendingClosing);
      console.log('[DEBUG] Closing modal test activé via URL');
    }
  }, [searchParams, currentProspect, currentCampaign, pendingClosing]);

  // Utiliser le test closing si présent, sinon utiliser le pendingClosing normal
  const effectiveClosing = testClosing || pendingClosing;

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

      <ActionButtons
        currentView={currentView}
        onHistoriqueAppels={() => setView('historique-appels')}
        onHistoriqueOffres={() => setView('historique-offres')}
        onRendezVous={() => setView('rendez-vous')}
        onCommande={handleCommande}
        onDoublon={handleDoublon}
        onRss={handleRss}
      />

      <div className={`landing-page__content ${currentView === 'commande' ? 'view-commande' : ''}`}>
        {currentView === 'qui-est-ce' && <QuiEstCe />}
        {currentView === 'qui-sommes-nous' && <QuiSommesNous />}
        {currentView === 'historique-appels' && <HistoriqueAppels />}
        {currentView === 'historique-offres' && <HistoriqueVentes />}
        {currentView === 'rendez-vous' && <RendezVous />}
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

      <ConfirmOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleOrderSuccess}
      />

      {effectiveClosing && !forceMode && (
        <ClosingModal
          isOpen={true}
          prospectId={effectiveClosing.prospectId}
          prospectName={effectiveClosing.prospectName}
          campagneId={effectiveClosing.campagneId}
          dureeAppel={effectiveClosing.dureeAppel}
          onComplete={() => {
            handleClosingComplete();
            if (testClosing) {
              setTestClosing(null); // Nettoyer le test closing après completion
              window.history.replaceState({}, '', window.location.pathname); // Retirer le paramètre URL
            }
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.type !== null}
        type={confirmModal.type === 'optout' ? 'danger' : 'warning'}
        title={confirmModal.type === 'doublon' ? 'Signaler un doublon' : 'Opt-out — Ne plus contacter'}
        message={
          confirmModal.type === 'doublon'
            ? 'Ce prospect sera marqué comme doublon. Cette action est définitive. Continuer ?'
            : 'Ce prospect ne sera plus jamais contacté. Cette action est définitive et irréversible. Continuer ?'
        }
        confirmText={confirmModal.type === 'doublon' ? 'Signaler doublon' : 'Confirmer opt-out'}
        isLoading={confirmModal.isLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ type: null, isLoading: false })}
      />
    </main>
  );
}
