import './landingPage.scss';
import { useEffect, useState } from 'react';
import { useProspect, useCampaign, useApp } from '../../../hooks';
import ProspectInfoHeader from '../../components/prospectInfoHeader/ProspectInfoHeader';
import ActionButtons from '../../components/actionButtons/ActionButtons';
import Loader from '../../components/loader/Loader';
import ErrorMessage from '../../components/errorMessage/ErrorMessage';
import HistoriqueAppels from '../../components/historiqueAppels/HistoriqueAppels';
import HistoriqueVentes from '../../components/historiqueVentes/HistoriqueVentes';
import RendezVous from '../../components/rendezVous/RendezVous';
import CatalogueProduits from '../../components/catalogueProduits/CatalogueProduits';
import Panier from '../../components/panier/Panier';
import ConfirmOrderModal from '../../components/confirmOrderModal/ConfirmOrderModal';

export default function LandingPage() {
  const { currentProspect, isLoading, error, loadProspect, clearError } = useProspect();
  const { loadCampaign, loadProduits } = useCampaign();
  const { currentView, setView } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    loadProspect(1);
    loadCampaign(1); // Charger la campagne 1 par défaut (Assurance Auto Q4 2024)
  }, [loadProspect, loadCampaign]);

  const handleInformationProspect = () => {
    setView('default');
    console.log('Information prospect clicked');
  };

  const handleQuiEstCe = () => {
    console.log('Qui est-ce clicked');
  };

  const handleQuiSommesNous = () => {
    console.log('Qui sommes-nous clicked');
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
    setView('default');

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
      <ProspectInfoHeader />

      <ActionButtons
        currentView={currentView}
        onInformationProspect={handleInformationProspect}
        onQuiEstCe={handleQuiEstCe}
        onQuiSommesNous={handleQuiSommesNous}
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
        {currentView === 'default' && (
          <div className="landing-page__default">
            <h2>Informations prospect</h2>
            <div className="info-section">
              <h3>Détails</h3>
              <p><strong>Statut :</strong> {currentProspect.statut}</p>
              <p><strong>Type :</strong> {currentProspect.type_prospect}</p>
              {currentProspect.raison_sociale && (
                <p><strong>Raison sociale :</strong> {currentProspect.raison_sociale}</p>
              )}
              {currentProspect.adresse && (
                <p><strong>Adresse :</strong> {currentProspect.adresse}</p>
              )}
              {currentProspect.code_postal && (
                <p><strong>Code postal :</strong> {currentProspect.code_postal}</p>
              )}
              {currentProspect.pays && (
                <p><strong>Pays :</strong> {currentProspect.pays}</p>
              )}
            </div>
            {currentProspect.notes && (
              <div className="info-section">
                <h3>Notes</h3>
                <p>{currentProspect.notes}</p>
              </div>
            )}
          </div>
        )}

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
