import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { campaignService } from '../API/services';
import { useCampaign, useDialer } from './index';
import type { PlanAppelEtape } from '../utils/types';
import { getErrorMessage } from '../utils/scripts/formatters';
import { resolveRuntimeCampaignId } from '../utils/scripts/runtimeCampaign';

interface UsePlanAppelReturn {
  etapes: PlanAppelEtape[];
  currentEtapeIndex: number;
  setCurrentEtapeIndex: (index: number) => void;
  campagneName: string;
  isLoading: boolean;
  error: string | null;
  loadPlanAppel: () => Promise<void>;
}

export function usePlanAppel(): UsePlanAppelReturn {
  const [searchParams] = useSearchParams();
  const { currentCampaign } = useCampaign();
  const { currentCampagneId } = useDialer();
  const campagneId = resolveRuntimeCampaignId({
    currentCampaignId: currentCampaign?.id_campagne,
    currentDialerCampaignId: currentCampagneId,
    urlCampaignId: searchParams.get('campagne'),
  });

  const [etapes, setEtapes] = useState<PlanAppelEtape[]>([]);
  const [currentEtapeIndex, setCurrentEtapeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campagneName, setCampagneName] = useState<string>('');

  const loadPlanAppel = useCallback(async () => {
    if (!campagneId) {
      setError('ID de campagne manquant');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Charger la campagne pour avoir le nom
      const campaign = await campaignService.getCampaignById(campagneId);
      setCampagneName(campaign.toJSON().nom_campagne);

      // Charger le plan d'appel
      const planAppel = await campaignService.getPlanAppel(campagneId);
      setEtapes(planAppel);

      if (planAppel.length === 0) {
        setError('Aucune etape definie pour cette campagne');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur lors du chargement'));
    } finally {
      setIsLoading(false);
    }
  }, [campagneId]);

  useEffect(() => {
    loadPlanAppel();
  }, [loadPlanAppel]);

  return {
    etapes,
    currentEtapeIndex,
    setCurrentEtapeIndex,
    campagneName,
    isLoading,
    error,
    loadPlanAppel,
  };
}
