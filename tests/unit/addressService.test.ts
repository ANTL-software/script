import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { capitalizeAddress } from '../../src/utils/scripts/addressFormatting.ts';
mock.module(new URL('../../src/utils/scripts/index.ts', import.meta.url).href, { namedExports: { capitalizeAddress } });
const { AddressService } = await import('../../src/API/services/Address.service.ts');
import type { AddressFeature } from '../../src/utils/types/index.ts';

const mockFeature: AddressFeature = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [2.3488, 48.8534],
  },
  properties: {
    id: '75101_6890_00008',
    label: '8 Boulevard du Palais 75001 Paris',
    score: 0.96,
    housenumber: '8',
    name: '8 Boulevard du Palais',
    postcode: '75001',
    citycode: '75101',
    city: 'Paris',
    district: 'Paris 1er Arrondissement',
    context: '75, Paris, Île-de-France',
    type: 'housenumber',
    street: 'Boulevard du Palais',
  },
};

test('AddressService.mapFeatureToSuggestion convertit fidèlement une feature BAN', () => {
  const service = AddressService.getInstance();
  const suggestion = service.mapFeatureToSuggestion(mockFeature);

  assert.equal(suggestion.id, '75101_6890_00008');
  assert.equal(suggestion.label, '8 Boulevard du Palais 75001 Paris');
  assert.equal(suggestion.name, '8 Boulevard du Palais');
  assert.equal(suggestion.postcode, '75001');
  assert.equal(suggestion.city, 'Paris');
  assert.equal(suggestion.citycode, '75101');
  assert.equal(suggestion.context, '75, Paris, Île-de-France');
  assert.equal(suggestion.type, 'housenumber');
  assert.equal(suggestion.housenumber, '8');
  assert.equal(suggestion.street, 'Boulevard du Palais');
  assert.deepEqual(suggestion.coordinates, [2.3488, 48.8534]);
});

test('AddressService.toSelectionResult extrait les champs normalisés pour le formulaire', () => {
  const service = AddressService.getInstance();
  const suggestion = service.mapFeatureToSuggestion(mockFeature);
  const result = service.toSelectionResult(suggestion);

  assert.equal(result.adresse, '8 Boulevard Du Palais');
  assert.equal(result.code_postal, '75001');
  assert.equal(result.ville, 'Paris');
  assert.equal(result.pays, 'France');
  assert.equal(result.label, '8 Boulevard Du Palais 75001 Paris');
  assert.equal(result.context, '75, Paris, Île-de-France');
});

test('AddressService.searchAddresses retourne un tableau vide si la requête est trop courte', async () => {
  const service = AddressService.getInstance();
  const res1 = await service.searchAddresses('');
  const res2 = await service.searchAddresses('a');
  const res3 = await service.searchAddresses('   ');

  assert.deepEqual(res1, []);
  assert.deepEqual(res2, []);
  assert.deepEqual(res3, []);
});

test('AddressService.searchAddresses traite les réponses JSON valides', async () => {
  const service = AddressService.getInstance();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => {
    return {
      ok: true,
      json: async () => ({
        type: 'FeatureCollection',
        version: 'draft',
        features: [mockFeature],
        attribution: 'BAN',
        licence: 'ODbL 1.0',
        query: '8 bd du palais',
        limit: 5,
      }),
    } as unknown as Response;
  }) as typeof fetch;

  try {
    const suggestions = await service.searchAddresses('8 bd du palais');
    assert.equal(suggestions.length, 1);
    assert.equal(suggestions[0].name, '8 Boulevard du Palais');
    assert.equal(suggestions[0].postcode, '75001');
    assert.equal(suggestions[0].city, 'Paris');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('AddressService.searchAddresses gère gracieusement les erreurs réseau sans crasher', async () => {
  const service = AddressService.getInstance();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => {
    throw new Error('Network error');
  }) as typeof fetch;

  try {
    await assert.rejects(service.searchAddresses('10 rue'), /Network error/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('les requêtes ciblent l’IGN et filtrent les données invalides', async () => {
  let url = '';
  const stub = mock.method(globalThis, 'fetch', async (input: RequestInfo | URL) => {
    url = String(input);
    return new Response(JSON.stringify({ features: [null, { properties: { name: 12 } }, mockFeature] }), { status: 200 });
  });
  try {
    const result = await AddressService.getInstance().searchAddresses('8 boulevard', { postcode: '75001' });
    assert.equal(result.length, 1);
    assert.equal(new URL(url).origin, 'https://data.geopf.fr');
    assert.equal(new URL(url).pathname, '/geocodage/search');
    assert.equal(new URL(url).searchParams.get('index'), 'address');
    assert.equal(new URL(url).searchParams.get('postcode'), '75001');
  } finally { stub.mock.restore(); }
});

test('capitalisation : accents, apostrophes, traits d’union et saisie manuelle', () => {
  assert.equal(capitalizeAddress("  12 BIS   RUE DE L'ÉGLISE À SAINT-ÉTIENNE\nBATIMENT 2 "), "12 Bis Rue De L'Église À Saint-Étienne\nBatiment 2");
});
