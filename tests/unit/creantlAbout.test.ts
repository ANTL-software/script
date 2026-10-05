import assert from 'node:assert/strict';
import test from 'node:test';

import { CREANTL_ABOUT, isCreantlCampaign } from '../../src/utils/scripts/creantlAbout.ts';

test('reconnait exclusivement la campagne Creantl', () => {
  assert.equal(isCreantlCampaign({ id_campagne: 15, nom_campagne: 'Creantl' }), true);
  assert.equal(isCreantlCampaign({ id_campagne: 99, nom_campagne: 'CREANTL' }), true);
  assert.equal(isCreantlCampaign({ id_campagne: 10, nom_campagne: 'MMA' }), false);
});

test('conserve le contenu Creantl fourni', () => {
  assert.equal(CREANTL_ABOUT.services.items.length, 6);
  assert.equal(CREANTL_ABOUT.agency.website, 'https://antl.com/');
  assert.equal(CREANTL_ABOUT.objective.content, 'Prise de RDV qualifiés en présentant l’expertise de Swiss Life');
});
