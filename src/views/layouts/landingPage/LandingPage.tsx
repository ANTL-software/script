import './landingPage.scss';
import { useEffect, useState } from 'react';
import { useProspect, useCampaign, useApp } from '../../../hooks';
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

export default function LandingPage() {
  const { currentProspect, isLoading, error, loadProspect, clearError } = useProspect();
  const { currentCampaign, loadCampaign, loadProduits } = useCampaign();
  const { currentView, setView } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    loadProspect(1);
    loadCampaign(1); // Charger la campagne 1 par défaut (Assurance Auto Q4 2024)
  }, [loadProspect, loadCampaign]);

  const handleQuiEstCe = () => {
    setView('qui-est-ce');
  };

  const handlePlanAppels = () => {
    const campagneId = currentCampaign?.id_campagne || 1;
    const url = `/plan-appel?campagne=${campagneId}`;
    window.open(url, 'plan-appel', 'width=900,height=700,menubar=no,toolbar=no,location=no,status=no');
  };

  const handleObjections = () => {
    console.log('Objections clicked');
  };

  const handleQuiSommesNous = () => {
    setView('qui-sommes-nous');
  };

  const handleHistoriqueAppels = () => {
    setView('historique-appels');
    console.log('Historique appels clicked');
  };

  const handleHistoriqueOffres = () => {
    setView('historique-offres');
    console.log('Historique offres clicked');
  };

  const handleRendezVous = () => {
    setView('rendez-vous');
    console.log('Rendez-vous clicked');
  };

  const handleCommande = () => {
    setView('commande');
    loadProduits();
    console.log('Commande clicked');
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOrderSuccess = () => {
    setShowSuccessMessage(true);
    setView('qui-est-ce');

    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 5000);
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
        onQuiEstCe={handleQuiEstCe}
        onPlanAppels={handlePlanAppels}
        onObjections={handleObjections}
        onQuiSommesNous={handleQuiSommesNous}
      />

      <ActionButtons
        currentView={currentView}
        onHistoriqueAppels={handleHistoriqueAppels}
        onHistoriqueOffres={handleHistoriqueOffres}
        onRendezVous={handleRendezVous}
        onCommande={handleCommande}
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
              <Panier onValidateOrder={handleOpenModal} />
            </div>
          </div>
        )}
      </div>

      <ConfirmOrderModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleOrderSuccess}
      />
    </main>
  );
}
