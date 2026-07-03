import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { campaignService } from '../API/services';
import { useCampaign, useDialer } from './index';
import type { PlanAppelEtape } from '../utils/types';
import { getErrorMessage } from '../utils/scripts/formatters';
import { resolveRuntimeCampaignId } from '../utils/scripts/runtimeCampaign';
import { CAMPAIGN_VARIANTS, isLeadB2BCampaign } from '../utils/scripts/campaignVariants';
import { CIGALES_PLAN_APPEL, MMA_PLAN_APPEL } from '../utils/scripts/staticPlanAppel';

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
  const matchedContextCampaign = currentCampaign?.id_campagne === campagneId ? currentCampaign : null;

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

      // Charger la campagne pour avoir le nom et le type
      let name = '';
      let type = '';
      try {
        const campaign = await campaignService.getCampaignById(campagneId);
        const data = campaign.toJSON();
        name = data.nom_campagne || '';
        type = data.type_campagne || '';
        setCampagneName(name);
      } catch (err) {
        console.warn('Impossible de charger les infos de la campagne, fallback...', err);
        // Si l'API échoue, on essaye de deviner ou d'utiliser le contexte local
        name = matchedContextCampaign?.nom_campagne || (campagneId === 7 ? 'Les Cigales' : 'MMA Planète Assurance') || '';
        type = matchedContextCampaign?.type_campagne || (campagneId === 7 ? CAMPAIGN_VARIANTS.vente : CAMPAIGN_VARIANTS.lead_b2b);
        setCampagneName(name);
      }

      // Charger le plan d'appel de l'API
      let planAppel: PlanAppelEtape[] = [];
      try {
        planAppel = await campaignService.getPlanAppel(campagneId);
      } catch (err) {
        console.warn('Impossible de charger le plan d\'appel de l\'API, utilisation du fallback statique...', err);
      }

      // Fallback statique si la base de données est vide ou injoignable
      if (!planAppel || planAppel.length === 0) {
        const isMMA = isLeadB2BCampaign({
          type_campagne: type === CAMPAIGN_VARIANTS.lead_b2b ? CAMPAIGN_VARIANTS.lead_b2b : CAMPAIGN_VARIANTS.vente,
          nom_campagne: name,
        });
        planAppel = isMMA ? MMA_PLAN_APPEL : CIGALES_PLAN_APPEL;
        console.log(`[usePlanAppel] Utilisation du plan d'appel statique de fallback pour ${isMMA ? 'MMA' : 'Cigales'}`);
      }

      setEtapes(planAppel);
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur lors du chargement'));
    } finally {
      setIsLoading(false);
    }
  }, [campagneId, matchedContextCampaign]);

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
