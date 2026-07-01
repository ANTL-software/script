import type { ViewType } from '../../context/appContext/AppContext';
import type { Campaign } from '../types/campaign.types';

export const CAMPAIGN_VARIANTS = {
  vente: 'vente',
  lead_b2b: 'lead_b2b',
} as const;

export type CampaignVariant = keyof typeof CAMPAIGN_VARIANTS;

export type ActionButtonId =
  | 'tarifs'
  | 'agrement'
  | 'historique-appels'
  | 'historique-offres'
  | 'rendez-vous'
  | 'commande';

export interface CampaignActionConfig {
  id: ActionButtonId;
  label: string;
  group: 'left' | 'right';
  targetView?: ViewType;
}

export interface CampaignUiConfig {
  variant: CampaignVariant;
  actions: CampaignActionConfig[];
  showPaniers: boolean;
  commandeMode: 'sales' | 'placeholder';
}

const VENTE_ACTIONS: CampaignActionConfig[] = [
  { id: 'tarifs', label: 'Tarifs', group: 'left' },
  { id: 'agrement', label: 'Agrément', group: 'left' },
  { id: 'historique-appels', label: 'Historique appels', group: 'right', targetView: 'historique-appels' },
  { id: 'historique-offres', label: 'Historique offres', group: 'right', targetView: 'historique-offres' },
  { id: 'rendez-vous', label: 'Rendez-vous', group: 'right', targetView: 'rendez-vous' },
  { id: 'commande', label: 'Commande', group: 'right', targetView: 'commande' },
];

const LEAD_B2B_ACTIONS: CampaignActionConfig[] = [
  { id: 'historique-appels', label: 'Historique appels', group: 'right', targetView: 'historique-appels' },
  { id: 'historique-offres', label: 'Historique rendez-vous', group: 'right', targetView: 'historique-rendez-vous' },
  { id: 'rendez-vous', label: 'Agenda personnel', group: 'right', targetView: 'rendez-vous' },
  { id: 'commande', label: 'Prise de rendez-vous client', group: 'right', targetView: 'commande' },
];

export function normalizeCampaignVariant(value: string | null | undefined): CampaignVariant {
  if (value === CAMPAIGN_VARIANTS.lead_b2b) {
    return CAMPAIGN_VARIANTS.lead_b2b;
  }

  return CAMPAIGN_VARIANTS.vente;
}

export function getCampaignVariant(campaign?: Pick<Campaign, 'type_campagne'> | null): CampaignVariant {
  return normalizeCampaignVariant(campaign?.type_campagne);
}

export function getCampaignUiConfig(campaign?: Pick<Campaign, 'type_campagne'> | null): CampaignUiConfig {
  const variant = getCampaignVariant(campaign);

  if (variant === CAMPAIGN_VARIANTS.lead_b2b) {
    return {
      variant,
      actions: LEAD_B2B_ACTIONS,
      showPaniers: false,
      commandeMode: 'placeholder',
    };
  }

  return {
    variant,
    actions: VENTE_ACTIONS,
    showPaniers: true,
    commandeMode: 'sales',
  };
}
