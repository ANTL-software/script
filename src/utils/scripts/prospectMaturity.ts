import type { ProspectMaturiteCommerciale } from '../types/prospect.types.ts';

export interface ProspectMaturityBadge {
  label: string;
  variant: 'client' | 'prospect' | 'unknown';
}

export const getProspectMaturityBadge = (
  maturite: ProspectMaturiteCommerciale | string | null | undefined,
): ProspectMaturityBadge => {
  if (maturite === 'client') {
    return { label: 'Client', variant: 'client' };
  }

  if (maturite === 'prospect') {
    return { label: 'Prospect', variant: 'prospect' };
  }

  return { label: 'Non renseignée', variant: 'unknown' };
};
