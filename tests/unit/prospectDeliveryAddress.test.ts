import assert from 'node:assert/strict';
import test from 'node:test';
import { getProspectDeliveryPrefill } from '../../src/utils/scripts/prospectDeliveryAddress.ts';

test('la livraison choisie dans QuiEstCe conserve sa propre ville dans la commande', () => {
  assert.deepEqual(getProspectDeliveryPrefill({ adresse_livraison: '12 Avenue Des Lilas, 75001 Paris', code_postal: '33000', ville: 'Bordeaux' }), { adresse: '12 Avenue Des Lilas', code_postal: '75001', ville: 'Paris' });
});
test('les saisies historiques non structurées ne sont ni tronquées ni devinées', () => {
  assert.deepEqual(getProspectDeliveryPrefill({ adresse_livraison: 'Entrée B, portail vert', code_postal: '33000', ville: 'Bordeaux' }), { adresse: 'Entrée B, portail vert', code_postal: '33000', ville: 'Bordeaux' });
  assert.deepEqual(getProspectDeliveryPrefill(null), { adresse: '', code_postal: '', ville: '' });
});
