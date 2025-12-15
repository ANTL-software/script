import './landingPage.scss';
import { useEffect, useState } from 'react';
import { useProspect } from '../../../hooks';
import ProspectInfoHeader from '../../components/prospectInfoHeader/ProspectInfoHeader';
import ActionButtons from '../../components/actionButtons/ActionButtons';
import Loader from '../../components/loader/Loader';
import ErrorMessage from '../../components/errorMessage/ErrorMessage';

export default function LandingPage() {
  const { currentProspect, isLoading, error, loadProspect, clearError } = useProspect();
  const [activeView, setActiveView] = useState<string>('default');

  useEffect(() => {
    loadProspect(1);
  }, [loadProspect]);

  const handleQuiEstCe = () => {
    console.log('Qui est-ce clicked');
  };

  const handleQuiSommesNous = () => {
    console.log('Qui sommes-nous clicked');
  };

  const handleHistoriqueAppels = () => {
    setActiveView('appels');
    console.log('Historique appels clicked');
  };

  const handleHistoriqueOffres = () => {
    setActiveView('offres');
    console.log('Historique offres clicked');
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
      <ProspectInfoHeader prospect={currentProspect} />

      <ActionButtons
        onQuiEstCe={handleQuiEstCe}
        onQuiSommesNous={handleQuiSommesNous}
        onHistoriqueAppels={handleHistoriqueAppels}
        onHistoriqueOffres={handleHistoriqueOffres}
      />

      <div className="landing-page__content">
        {activeView === 'default' && (
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

        {activeView === 'appels' && (
          <div className="landing-page__historique">
            <h2>Historique des appels</h2>
            <p>Fonctionnalité à venir...</p>
          </div>
        )}

        {activeView === 'offres' && (
          <div className="landing-page__historique">
            <h2>Historique des offres</h2>
            <p>Fonctionnalité à venir...</p>
          </div>
        )}
      </div>
    </main>
  );
}
