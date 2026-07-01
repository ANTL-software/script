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
