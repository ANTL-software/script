import './planAppelPage.scss';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { campaignService } from '../../../API/services';
import Button from '../../components/button/Button';
import Loader from '../../components/loader/Loader';
import { FaPrint, FaChevronLeft, FaChevronRight, FaListOl } from 'react-icons/fa';
import type { PlanAppelEtape } from '../../../utils/types';
import { getErrorMessage } from '../../../utils/scripts/formatters';

export default function PlanAppelPage() {
  const [searchParams] = useSearchParams();
  const campagneId = searchParams.get('campagne');

  const [etapes, setEtapes] = useState<PlanAppelEtape[]>([]);
  const [currentEtapeIndex, setCurrentEtapeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campagneName, setCampagneName] = useState<string>('');

  useEffect(() => {
    const loadPlanAppel = async () => {
      if (!campagneId) {
        setError('ID de campagne manquant');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Charger la campagne pour avoir le nom
        const campaign = await campaignService.getCampaignById(Number(campagneId));
        setCampagneName(campaign.toJSON().nom_campagne);

        // Charger le plan d'appel
        const planAppel = await campaignService.getPlanAppel(Number(campagneId));
        setEtapes(planAppel);

        if (planAppel.length === 0) {
          setError('Aucune etape definie pour cette campagne');
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Erreur lors du chargement'));
      } finally {
        setIsLoading(false);
      }
    };

    loadPlanAppel();
  }, [campagneId]);

  const handlePrevious = () => {
    if (currentEtapeIndex > 0) {
      setCurrentEtapeIndex(currentEtapeIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentEtapeIndex < etapes.length - 1) {
      setCurrentEtapeIndex(currentEtapeIndex + 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentEtapeIndex(index);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="plan-appel-page">
        <div className="plan-appel-page__loader">
          <Loader size="large" />
          <p>Chargement du plan d'appel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plan-appel-page">
        <div className="plan-appel-page__error">
          <FaListOl className="plan-appel-page__error-icon" />
          <h2>Plan d'appel</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const currentEtape = etapes[currentEtapeIndex];

  return (
    <div className="plan-appel-page">
      <header className="plan-appel-page__header">
        <div className="plan-appel-page__title">
          <FaListOl className="plan-appel-page__icon" />
          <div>
            <h1>Plan d'appel</h1>
            <span className="plan-appel-page__campaign-name">{campagneName}</span>
          </div>
        </div>
        <Button variant="ghost" size="small" onClick={handlePrint} className="print-button">
          <FaPrint /> Imprimer
        </Button>
      </header>

      <div className="plan-appel-page__stepper">
        {etapes.map((etape, index) => (
          <button
            key={etape.id_plan}
            className={`plan-appel-page__step ${index === currentEtapeIndex ? 'plan-appel-page__step--active' : ''} ${index < currentEtapeIndex ? 'plan-appel-page__step--completed' : ''}`}
            onClick={() => handleStepClick(index)}
          >
            <span className="plan-appel-page__step-number">{index + 1}</span>
            <span className="plan-appel-page__step-title">{etape.titre}</span>
          </button>
        ))}
      </div>

      <main className="plan-appel-page__content">
        <div className="plan-appel-page__etape">
          <div className="plan-appel-page__etape-header">
            <span className="plan-appel-page__etape-number">Etape {currentEtapeIndex + 1} / {etapes.length}</span>
            <h2 className="plan-appel-page__etape-title">{currentEtape.titre}</h2>
          </div>
          <div className="plan-appel-page__etape-content">
            {currentEtape.contenu.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </main>

      <footer className="plan-appel-page__footer">
        <Button
          variant="secondary"
          size="medium"
          onClick={handlePrevious}
          disabled={currentEtapeIndex === 0}
        >
          <FaChevronLeft /> Precedent
        </Button>
        <span className="plan-appel-page__progress">
          {currentEtapeIndex + 1} / {etapes.length}
        </span>
        <Button
          variant="primary"
          size="medium"
          onClick={handleNext}
          disabled={currentEtapeIndex === etapes.length - 1}
        >
          Suivant <FaChevronRight />
        </Button>
      </footer>
    </div>
  );
}
