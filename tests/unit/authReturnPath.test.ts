import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getAuthReturnPathFromState,
  normalizeAuthReturnPath,
} from '../../src/utils/scripts/authReturnPath.ts';

test('les routes internes protégées peuvent être restaurées après connexion', () => {
  assert.equal(
    normalizeAuthReturnPath('/plan-appel?campagne=9'),
    '/plan-appel?campagne=9',
  );
  assert.equal(
    getAuthReturnPathFromState({ returnTo: '/objections?campagne=7' }),
    '/objections?campagne=7',
  );
});

test('une destination externe ou la page de connexion ne peut pas devenir un retour auth', () => {
  assert.equal(normalizeAuthReturnPath('https://example.com'), null);
  assert.equal(normalizeAuthReturnPath('//example.com'), null);
  assert.equal(normalizeAuthReturnPath('/login'), null);
  assert.equal(getAuthReturnPathFromState({ returnTo: 42 }), null);
  assert.equal(getAuthReturnPathFromState(null), null);
});
