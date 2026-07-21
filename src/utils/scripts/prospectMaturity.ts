import type { ProspectRelationCommercialeCampagneStatut } from '../types/prospect.types.ts';

export interface ProspectMaturityBadge {
  label: string;
  variant: ProspectRelationCommercialeCampagneStatut;
}

export const getProspectRelationBadge = (
  relation: ProspectRelationCommercialeCampagneStatut | null | undefined,
): ProspectMaturityBadge => {
  if (relation === 'client') {
    return { label: 'Client', variant: 'client' };
  }

  if (relation === 'lead_genere') {
    return { label: 'Lead généré', variant: 'lead_genere' };
  }

  return { label: 'Prospect', variant: 'prospect' };
};
