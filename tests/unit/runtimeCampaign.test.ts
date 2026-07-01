import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveRuntimeCampaignId } from '../../src/utils/scripts/runtimeCampaign.ts';

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
