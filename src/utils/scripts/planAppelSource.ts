import type { CampaignVariant } from './campaignVariants.ts';
import { CAMPAIGN_VARIANTS, isLeadB2BCampaign } from './campaignVariants.ts';
import type { PlanAppelEtape } from '../types/index.ts';
import { CIGALES_PLAN_APPEL, MMA_PLAN_APPEL, FGA_PLAN_APPEL } from './staticPlanAppel.ts';

interface PlanAppelCampaignDescriptor {
  id_campagne?: number | null;
  type_campagne?: CampaignVariant | null;
  nom_campagne?: string | null;
}

const CIGALES_CAMPAIGN_KEYWORD = 'cigales';

export function shouldForceLegacyStaticPlanAppel(
  campaign?: PlanAppelCampaignDescriptor | null,
): boolean {
  const campaignName = campaign?.nom_campagne?.trim().toLowerCase() ?? '';

  if (isLeadB2BCampaign({
    type_campagne: campaign?.type_campagne ?? CAMPAIGN_VARIANTS.vente,
    nom_campagne: campaign?.nom_campagne ?? '',
  })) {
    return false;
  }

  return campaign?.id_campagne === 7 || campaignName.includes(CIGALES_CAMPAIGN_KEYWORD);
}

export function getStaticPlanAppelForCampaign(
  campaign?: PlanAppelCampaignDescriptor | null,
): PlanAppelEtape[] {
  const campaignName = campaign?.nom_campagne?.trim().toLowerCase() ?? '';

  if (campaign?.id_campagne === 11 || campaignName.includes('fga')) {
    return FGA_PLAN_APPEL;
  }

  if (isLeadB2BCampaign({
    type_campagne: campaign?.type_campagne ?? CAMPAIGN_VARIANTS.vente,
    nom_campagne: campaign?.nom_campagne ?? '',
  })) {
    return MMA_PLAN_APPEL;
  }

  return CIGALES_PLAN_APPEL;
}
