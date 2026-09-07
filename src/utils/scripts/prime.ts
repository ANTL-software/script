import type { PrimeStats, SeuilPrimeStats } from '../types/index.ts';

const formatEuro = (value: number): string => new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
}).format(value);

export const formatPrimeObjective = (value: number, unit: PrimeStats['unite_objectif']): string => (
  unit === 'lead'
    ? `${value} lead${value > 1 ? 's' : ''}`
    : formatEuro(value)
);

export const formatPrimeBonus = (threshold: SeuilPrimeStats, fixedSalary: number): string => (
  threshold.seuil_pourcentage === 0
    ? `Fixe ${formatEuro(fixedSalary)}`
    : `+${formatEuro(threshold.montant_prime)}`
);

export const formatPrimeProduction = (prime: PrimeStats, ventesMoisCount: number): string => (
  prime.unite_objectif === 'lead'
    ? `${formatPrimeObjective(prime.valeur_realisee, 'lead')} produit${prime.valeur_realisee > 1 ? 's' : ''}`
    : `${ventesMoisCount} vente${ventesMoisCount > 1 ? 's' : ''} · ${formatEuro(prime.valeur_realisee)}`
);

export const sortPrimeThresholds = (thresholds: SeuilPrimeStats[]): SeuilPrimeStats[] => (
  [...thresholds].sort((left, right) => left.seuil_pourcentage - right.seuil_pourcentage)
);

export const formatPrimeAmount = formatEuro;
