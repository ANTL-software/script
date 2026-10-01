import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPrimeBonus,
  formatPrimeObjective,
  formatPrimeProduction,
  sortPrimeThresholds,
} from '../../src/utils/scripts/prime.ts';
import type { PrimeStats } from '../../src/utils/types/stats.types.ts';

const globalPrime: PrimeStats = {
  niveau: 1,
  code_niveau: 'palier_1',
  libelle: 'Junior',
  unite_objectif: 'euro',
  salaire_fixe: 1500,
  objectif: 5000,
  valeur_realisee: 4800,
  pourcentage_atteint: 96,
  prime_debloquee: 600,
  remuneration_totale: 2100,
  production: { ventes_mois_count: 0, ventes_mois_montant: 0, leads_mois_count: 32, leads_mois_valeur: 4800 },
  paliers: [
    { seuil_pourcentage: 100, objectif_palier: 5000, montant_prime: 1200, montant_total: 2700, debloque: false },
    { seuil_pourcentage: 0, objectif_palier: 0, montant_prime: 0, montant_total: 1500, debloque: true },
    { seuil_pourcentage: 90, objectif_palier: 4500, montant_prime: 600, montant_total: 2100, debloque: true },
    { seuil_pourcentage: 75, objectif_palier: 3750, montant_prime: 300, montant_total: 1800, debloque: true },
  ],
};

test('la jauge globale présente les objectifs en euros et les quatre seuils ordonnés', () => {
  assert.equal(formatPrimeObjective(5000).replace(/\s/g, ' '), '5 000 €');
  assert.equal(formatPrimeProduction(globalPrime).replace(/\s/g, ' '), '0 vente · 0 € + 32 leads · 4 800 €');
  assert.deepEqual(
    sortPrimeThresholds(globalPrime.paliers).map(({ objectif_palier }) => objectif_palier),
    [0, 3750, 4500, 5000],
  );
});

test('le seuil zéro décrit le fixe et les autres seuils le bonus', () => {
  const thresholds = sortPrimeThresholds(globalPrime.paliers);
  assert.match(formatPrimeBonus(thresholds[0], globalPrime.salaire_fixe), /^Fixe /);
  assert.match(formatPrimeBonus(thresholds[1], globalPrime.salaire_fixe), /^\+/);
});
