import type { AgentRuntimeCampaign } from '../types';

export interface ResolveRuntimeCampaignIdParams {
  currentCampaignId?: number | null;
  currentDialerCampaignId?: number | null;
  urlCampaignId?: string | number | null;
}

const parseCampaignId = (value: string | number | null | undefined): number | null => {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
};

export const resolveRuntimeCampaignId = ({
  currentCampaignId,
  currentDialerCampaignId,
  urlCampaignId,
}: ResolveRuntimeCampaignIdParams): number | null => {
  return parseCampaignId(currentCampaignId)
    ?? parseCampaignId(currentDialerCampaignId)
    ?? parseCampaignId(urlCampaignId);
};

export const pickRuntimeCampaign = (
  campagnes: AgentRuntimeCampaign[],
  currentCampagneId: number | null,
  statusCampaignId?: number | null,
): AgentRuntimeCampaign | null => {
  const resolvedStatusCampaignId = parseCampaignId(statusCampaignId);

  return campagnes.find((campagne) => campagne.id_campagne === currentCampagneId)
    ?? campagnes.find((campagne) => campagne.is_active_runtime)
    ?? (resolvedStatusCampaignId
      ? campagnes.find((campagne) => campagne.id_campagne === resolvedStatusCampaignId) ?? null
      : null)
    ?? (campagnes.length === 1 ? campagnes[0] : null);
};

export const pickDialerBootstrapCampaign = (
  campagnes: AgentRuntimeCampaign[],
  statusCampaignId?: number | null,
  previousCampaignId?: number | null,
): AgentRuntimeCampaign | null => {
  const resolvedStatusCampaignId = parseCampaignId(statusCampaignId);
  const resolvedPreviousCampaignId = parseCampaignId(previousCampaignId);

  return (resolvedStatusCampaignId
    ? campagnes.find((campagne) => campagne.id_campagne === resolvedStatusCampaignId) ?? null
    : null)
    ?? campagnes.find((campagne) => campagne.is_active_runtime)
    ?? (resolvedPreviousCampaignId
      ? campagnes.find((campagne) => campagne.id_campagne === resolvedPreviousCampaignId) ?? null
      : null)
    ?? (campagnes.length === 1 ? campagnes[0] : null);
};

export const resolveManualCallOrigin = (rendezVousSourceId?: number | null): 'manuel' | 'rappel' => {
  return parseCampaignId(rendezVousSourceId) ? 'rappel' : 'manuel';
};
