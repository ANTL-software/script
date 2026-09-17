import assert from 'node:assert/strict';
import test from 'node:test';

import { isSwissLifeIndCampaign, SWISS_LIFE_IND_ABOUT } from '../../src/utils/scripts/swissLifeIndAbout.ts';

test('reconnait exclusivement la campagne Swiss Life IND', () => {
  assert.equal(isSwissLifeIndCampaign({ id_campagne: 14, nom_campagne: 'Swiss Life IND' }), true);
  assert.equal(isSwissLifeIndCampaign({ id_campagne: 10, nom_campagne: 'MMA' }), false);
  assert.equal(isSwissLifeIndCampaign({ id_campagne: 99, nom_campagne: 'Swiss Life IND' }), true);
});

test('conserve le contenu Swiss Life IND fourni', () => {
  assert.equal(SWISS_LIFE_IND_ABOUT.products.items.length, 4);
  assert.equal(SWISS_LIFE_IND_ABOUT.products.introduction.includes('cinq grands domaines'), true);
  assert.equal(SWISS_LIFE_IND_ABOUT.keyFigures.content.includes('225 1000'), true);
  assert.equal(SWISS_LIFE_IND_ABOUT.objective.strengths[0], 'Rdv gratuit avec l’un des gérants pour audit assurantiel');
});
