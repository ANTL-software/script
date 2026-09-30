import type { PrimeStats, SeuilPrimeStats } from '../types/index.ts';

const formatEuro = (value: number): string => new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
}).format(value);

export const formatPrimeObjective = (value: number): string => (
  formatEuro(value)
);

export const formatPrimeBonus = (threshold: SeuilPrimeStats, fixedSalary: number): string => (
  threshold.seuil_pourcentage === 0
    ? `Fixe ${formatEuro(fixedSalary)}`
    : `+${formatEuro(threshold.montant_prime)}`
);

export const formatPrimeProduction = (prime: PrimeStats): string => {
  const production = prime.production;
  return `${production.ventes_mois_count} vente${production.ventes_mois_count > 1 ? 's' : ''} · ${formatEuro(production.ventes_mois_montant)} + ${production.leads_mois_count} lead${production.leads_mois_count > 1 ? 's' : ''} · ${formatEuro(production.leads_mois_valeur)}`;
};

export const sortPrimeThresholds = (thresholds: SeuilPrimeStats[]): SeuilPrimeStats[] => (
  [...thresholds].sort((left, right) => left.seuil_pourcentage - right.seuil_pourcentage)
);

export const formatPrimeAmount = formatEuro;
