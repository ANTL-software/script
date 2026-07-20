import assert from 'node:assert/strict';
import test from 'node:test';
import { getProspectMaturityBadge } from '../../src/utils/scripts/prospectMaturity.ts';

test('maps the USV maturity colors to script badge variants', () => {
  assert.deepEqual(getProspectMaturityBadge('client'), {
    label: 'Client',
    variant: 'client',
  });
  assert.deepEqual(getProspectMaturityBadge('prospect'), {
    label: 'Prospect',
    variant: 'prospect',
  });
});

test('keeps an explicit fallback when the prospect maturity is absent', () => {
  assert.deepEqual(getProspectMaturityBadge(null), {
    label: 'Non renseignée',
    variant: 'unknown',
  });
});
