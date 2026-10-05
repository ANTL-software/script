import assert from 'node:assert/strict';
import test from 'node:test';

import { isZoeNoeCampaign, ZOE_NOE_ABOUT } from '../../src/utils/scripts/zoeNoeAbout.ts';

test('reconnait exclusivement la campagne Zoé-Noé', () => {
  assert.equal(isZoeNoeCampaign({ id_campagne: 13, nom_campagne: 'zoenoe' }), true);
  assert.equal(isZoeNoeCampaign({ id_campagne: 99, nom_campagne: 'Zoé-Noé Caillibotte' }), true);
  assert.equal(isZoeNoeCampaign({ id_campagne: 10, nom_campagne: 'MMA' }), false);
});

test('conserve le contenu Zoenoe fourni', () => {
  assert.equal(ZOE_NOE_ABOUT.services.items.length, 4);
  assert.equal(ZOE_NOE_ABOUT.agency.website, 'https://zoenoe.com/');
  assert.equal(ZOE_NOE_ABOUT.objective.strengths[1], 'RDV à distance');
});
