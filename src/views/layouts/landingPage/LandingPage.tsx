import './landingPage.scss';
import { useParams } from 'react-router-dom';
import { useLandingPage } from '../../../hooks/useLandingPage';
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

export default function LandingPage() {
  const { id } = useParams<{ id: string }>();
  const {
    currentProspect, currentView, isLoading, error, clearError,
    isModalOpen, setIsModalOpen, showSuccessMessage, pendingClosing,
    confirmModal, setConfirmModal,
    handlePlanAppels, handleObjections, handleCommande,
    handleDoublon, handleRss, handleConfirmAction,
    handleOrderSuccess, handleClosingComplete,
    setView,
  } = useLandingPage(id);

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

      {showSuccessMessage && (
        <div className="landing-page__success-message">
          <p>Commande enregistrée avec succès ! Un devis a été envoyé par email au prospect.</p>
        </div>
      )}

      <div className="landing-page__content">
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

      {pendingClosing && (
        <ClosingModal
          isOpen={true}
          prospectId={pendingClosing.prospectId}
          prospectName={pendingClosing.prospectName}
          campagneId={pendingClosing.campagneId}
          dureeAppel={pendingClosing.dureeAppel}
          onComplete={handleClosingComplete}
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
