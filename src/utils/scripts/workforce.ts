import type { Prospect, UpdateProspectData } from '../types/index.ts';

export interface WorkforceRange {
  min: string;
  max: string;
}

const parseLegacyWorkforceRange = (value: string): WorkforceRange => {
  const values = value.match(/\d+/g)?.slice(0, 2) ?? [];
  return {
    min: values[0] ?? '',
    max: values[1] ?? values[0] ?? '',
  };
};

export const getWorkforceRange = (prospect: Pick<Prospect, 'effectif' | 'effectif_libelle' | 'effectif_min' | 'effectif_max'>): WorkforceRange => {
  if (prospect.effectif_min !== undefined || prospect.effectif_max !== undefined) {
    return {
      min: prospect.effectif_min?.toString() ?? '',
      max: prospect.effectif_max?.toString() ?? '',
    };
  }

  if (prospect.effectif_libelle) {
    return parseLegacyWorkforceRange(prospect.effectif_libelle);
  }

  const exactWorkforce = prospect.effectif?.toString() ?? '';
  return { min: exactWorkforce, max: exactWorkforce };
};

export const buildWorkforceUpdate = (min: string, max: string): UpdateProspectData => {
  const normalizedMin = min.trim();
  const normalizedMax = max.trim();
  const workforceMin = normalizedMin === '' ? null : Number(normalizedMin);
  const workforceMax = normalizedMax === '' ? null : Number(normalizedMax);
  const hasExactWorkforce = workforceMin !== null && workforceMin === workforceMax;

  return {
    effectif_min: workforceMin,
    effectif_max: workforceMax,
    effectif: hasExactWorkforce ? workforceMin : null,
    effectif_libelle: workforceMin !== null && workforceMax !== null && !hasExactWorkforce
      ? `${workforceMin} à ${workforceMax}`
      : null,
  };
};
