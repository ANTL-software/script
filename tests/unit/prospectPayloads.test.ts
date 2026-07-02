import assert from 'node:assert/strict';
import test from 'node:test';

import { buildProspectOptoutPayload } from '../../src/API/services/prospectPayloads.ts';

test('buildProspectOptoutPayload transporte la campagne runtime pour un optout', () => {
  assert.deepEqual(buildProspectOptoutPayload(7), {
    id_campagne: 7,
  });
});
