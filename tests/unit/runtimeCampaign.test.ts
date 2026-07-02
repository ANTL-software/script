import assert from 'node:assert/strict';
import test from 'node:test';

import { pickRuntimeCampaign, resolveManualCallOrigin, resolveRuntimeCampaignId } from '../../src/utils/scripts/runtimeCampaign.ts';

test('resolveRuntimeCampaignId priorise la campagne du contexte front', () => {
  assert.equal(
    resolveRuntimeCampaignId({
      currentCampaignId: 7,
      currentDialerCampaignId: 3,
      urlCampaignId: '9',
    }),
    7,
  );
});

test('resolveRuntimeCampaignId utilise la campagne runtime dialer avant l URL', () => {
  assert.equal(
    resolveRuntimeCampaignId({
      currentCampaignId: null,
      currentDialerCampaignId: 3,
      urlCampaignId: '9',
    }),
    3,
  );
});

test('resolveRuntimeCampaignId conserve un fallback URL de compatibilite', () => {
  assert.equal(
    resolveRuntimeCampaignId({
      currentCampaignId: null,
      currentDialerCampaignId: null,
      urlCampaignId: '9',
    }),
    9,
  );
});

test('resolveRuntimeCampaignId retourne null si aucune campagne exploitable n est disponible', () => {
  assert.equal(
    resolveRuntimeCampaignId({
      currentCampaignId: null,
      currentDialerCampaignId: null,
      urlCampaignId: 'abc',
    }),
    null,
  );
});

test('pickRuntimeCampaign priorise la campagne déjà portée par la fiche active', () => {
  const result = pickRuntimeCampaign(
    [
      { id_campagne: 7, nom_campagne: 'Les Cigales', type_campagne: 'vente', statut: 'active', autoriser_mobile: false },
      { id_campagne: 9, nom_campagne: 'MMA', type_campagne: 'lead_b2b', statut: 'active', autoriser_mobile: false, is_active_runtime: true },
    ],
    7,
    9,
  );

  assert.equal(result?.id_campagne, 7);
});

test('pickRuntimeCampaign retombe sur la campagne runtime signalée par le backend', () => {
  const result = pickRuntimeCampaign(
    [
      { id_campagne: 7, nom_campagne: 'Les Cigales', type_campagne: 'vente', statut: 'active', autoriser_mobile: false },
      { id_campagne: 9, nom_campagne: 'MMA', type_campagne: 'lead_b2b', statut: 'active', autoriser_mobile: false, is_active_runtime: true },
    ],
    null,
    null,
  );

  assert.equal(result?.id_campagne, 9);
});

test('pickRuntimeCampaign utilise le statut dialer historique si le flag runtime n est pas encore hydraté', () => {
  const result = pickRuntimeCampaign(
    [
      { id_campagne: 7, nom_campagne: 'Les Cigales', type_campagne: 'vente', statut: 'active', autoriser_mobile: false },
      { id_campagne: 9, nom_campagne: 'MMA', type_campagne: 'lead_b2b', statut: 'active', autoriser_mobile: false },
    ],
    null,
    7,
  );

  assert.equal(result?.id_campagne, 7);
});

test('pickRuntimeCampaign tolère une campagne runtime obsolète et conserve le fallback mono-affectation', () => {
  const result = pickRuntimeCampaign(
    [
      { id_campagne: 7, nom_campagne: 'Les Cigales', type_campagne: 'vente', statut: 'active', autoriser_mobile: false },
    ],
    null,
    99,
  );

  assert.equal(result?.id_campagne, 7);
});

test('resolveManualCallOrigin distingue rappel et appel manuel sans ambiguite', () => {
  assert.equal(resolveManualCallOrigin(12), 'rappel');
  assert.equal(resolveManualCallOrigin(undefined), 'manuel');
  assert.equal(resolveManualCallOrigin(null), 'manuel');
});
