import assert from 'node:assert/strict';
import test from 'node:test';

import { ProduitModel } from '../../src/API/models/Produit.model.ts';
import type { Produit } from '../../src/utils/types/index.ts';

test('ProduitModel expose codeProduitOrigine et code', () => {
  const rawProduct: Produit = {
    id_produit: 42,
    code_produit: 'PROD-042',
    code_produit_origine: 'CAT-REF-99',
    nom_produit: 'Stylo Bille Bleu',
    actif: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  const model = ProduitModel.fromJSON(rawProduct);

  assert.equal(model.id, 42);
  assert.equal(model.code, 'PROD-042');
  assert.equal(model.codeProduitOrigine, 'CAT-REF-99');
  assert.equal(model.nom, 'Stylo Bille Bleu');
});

test('ProduitModel gère code_produit_origine null ou absent', () => {
  const rawProduct: Produit = {
    id_produit: 43,
    code_produit: 'PROD-043',
    nom_produit: 'Crayon Papier',
    actif: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  const model = ProduitModel.fromJSON(rawProduct);

  assert.equal(model.codeProduitOrigine, undefined);
});

test('recherche de produit par code_produit_origine (référence catalogue)', () => {
  const products: Produit[] = [
    {
      id_produit: 1,
      code_produit: 'INT-01',
      code_produit_origine: 'REF-BIC-BLUE',
      nom_produit: 'Stylo standard',
      actif: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id_produit: 2,
      code_produit: 'INT-02',
      code_produit_origine: 'REF-PILOT-RED',
      nom_produit: 'Roller encre gel',
      actif: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id_produit: 3,
      code_produit: 'INT-03',
      nom_produit: 'Gomme blanche',
      actif: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  const search = (term: string) => {
    const s = term.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.nom_produit.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s) ||
        p.code_produit?.toLowerCase().includes(s) ||
        p.code_produit_origine?.toLowerCase().includes(s) ||
        p.typeProduit?.libelle_type?.toLowerCase().includes(s)
    );
  };

  const resultsByOriginCode = search('PILOT');
  assert.equal(resultsByOriginCode.length, 1);
  assert.equal(resultsByOriginCode[0].id_produit, 2);

  const resultsByBic = search('REF-BIC');
  assert.equal(resultsByBic.length, 1);
  assert.equal(resultsByBic[0].id_produit, 1);

  const resultsByName = search('Gomme');
  assert.equal(resultsByName.length, 1);
  assert.equal(resultsByName[0].id_produit, 3);
});
