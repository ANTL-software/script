import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWorkforceUpdate, getWorkforceRange } from '../../src/utils/scripts/workforce.ts';

test('les bornes structurées sont prioritaires sur les anciens champs effectif', () => {
  assert.deepEqual(getWorkforceRange({ effectif: 10, effectif_libelle: '4 à 10', effectif_min: 4, effectif_max: 10 }), {
    min: '4',
    max: '10',
  });
});

test('une ancienne fourchette reste affichable avec deux bornes numériques', () => {
  assert.deepEqual(getWorkforceRange({ effectif_libelle: '4 à 10' }), { min: '4', max: '10' });
});

test('la saisie 1 à 1 garde des bornes exploitables et un effectif exact historique', () => {
  assert.deepEqual(buildWorkforceUpdate('1', '1'), {
    effectif_min: 1,
    effectif_max: 1,
    effectif: 1,
    effectif_libelle: null,
  });
});

test('la saisie 1 à 14 garde les deux bornes et une compatibilité legacy normalisée', () => {
  assert.deepEqual(buildWorkforceUpdate('1', '14'), {
    effectif_min: 1,
    effectif_max: 14,
    effectif: null,
    effectif_libelle: '1 à 14',
  });
});
