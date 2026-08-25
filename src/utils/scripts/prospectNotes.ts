export const FGA_PROSPECT_NOTE_CAMPAIGN_ID = 11;

export function supportsStandaloneProspectNotes(campaignId: number | null | undefined): boolean {
  return campaignId === FGA_PROSPECT_NOTE_CAMPAIGN_ID;
}

export function resolveClosingNotes(
  campaignId: number,
  callNotes: string,
  prospectNotes: string,
): string {
  return supportsStandaloneProspectNotes(campaignId) ? prospectNotes : callNotes;
}
