import assert from 'node:assert/strict';
import test from 'node:test';
import { getProspectRelationBadge } from '../../src/utils/scripts/prospectMaturity.ts';

test('maps campaign-scoped commercial relations to script badge variants', () => {
  assert.deepEqual(getProspectRelationBadge('client'), {
    label: 'Client',
    variant: 'client',
  });
  assert.deepEqual(getProspectRelationBadge('lead_genere'), {
    label: 'Lead généré',
    variant: 'lead_genere',
  });
  assert.deepEqual(getProspectRelationBadge('prospect'), {
    label: 'Prospect',
    variant: 'prospect',
  });
});

test('keeps prospect as the default when no campaign relation exists', () => {
  assert.deepEqual(getProspectRelationBadge(null), {
    label: 'Prospect',
    variant: 'prospect',
  });
});
