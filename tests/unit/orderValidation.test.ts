import assert from 'node:assert/strict';
import test from 'node:test';

import { buildVentePayload, validateOrderForm } from '../../src/utils/scripts/orderValidation.ts';

const baseFormData = {
  adresse_facturation: '10 rue des Lilas',
  adresse_livraison: '20 avenue Victor Hugo',
  code_postal_facturation: '75001',
  code_postal_livraison: '69002',
  ville_facturation: 'Paris',
  ville_livraison: 'Lyon',
  pays_facturation: 'France',
  pays_livraison: 'France',
  meme_adresse: false,
  mode_paiement: 'Cheque',
  notes: '  Merci de rappeler avant livraison  ',
  delais_livraison: 4 as const,
  civilite: 'Mme',
  nom_contact: 'Durand',
  plage_horaire_livraison: '  9h-12h  ',
  livraison_offerte: true,
};

test('validateOrderForm remonte les erreurs attendues', () => {
  const errors = validateOrderForm({
    ...baseFormData,
    adresse_facturation: ' ',
    code_postal_facturation: '75',
    ville_facturation: '',
    pays_facturation: '',
    adresse_livraison: '',
    code_postal_livraison: 'abcde',
    ville_livraison: '',
    pays_livraison: '',
    civilite: '',
    nom_contact: '',
  });

  assert.equal(errors.adresse_facturation, "L'adresse de facturation est obligatoire");
  assert.equal(errors.code_postal_facturation, 'Le code postal doit contenir 5 chiffres');
  assert.equal(errors.ville_facturation, 'La ville de facturation est obligatoire');
  assert.equal(errors.pays_facturation, 'Le pays de facturation est obligatoire');
  assert.equal(errors.adresse_livraison, "L'adresse de livraison est obligatoire");
  assert.equal(errors.code_postal_livraison, 'Le code postal doit contenir 5 chiffres');
  assert.equal(errors.ville_livraison, 'La ville de livraison est obligatoire');
  assert.equal(errors.pays_livraison, 'Le pays de livraison est obligatoire');
  assert.equal(errors.civilite, 'La civilité du contact est obligatoire');
  assert.equal(errors.nom_contact, 'Le nom du contact est obligatoire');
});

test('validateOrderForm ignore les champs de livraison si meme_adresse est vrai', () => {
  const errors = validateOrderForm({
    ...baseFormData,
    meme_adresse: true,
    adresse_livraison: '',
    code_postal_livraison: '',
    ville_livraison: '',
    pays_livraison: '',
  });

  assert.deepEqual(errors, {});
});

test('buildVentePayload réutilise l’adresse de facturation si meme_adresse est vrai', () => {
  const payload = buildVentePayload({
    prospectId: 17,
    campagneId: 4,
    formData: {
      ...baseFormData,
      meme_adresse: true,
      notes: '   ',
      plage_horaire_livraison: '   ',
    },
    items: [
      {
        produit: { id_produit: 9 },
        quantite: 2,
        prix_unitaire: 150,
        remise: 10,
      },
    ],
  });

  assert.equal(payload.id_prospect, 17);
  assert.equal(payload.id_campagne, 4);
  assert.equal(payload.adresse_livraison, '10 rue des Lilas');
  assert.equal(payload.code_postal_livraison, '75001');
  assert.equal(payload.ville_livraison, 'Paris');
  assert.equal(payload.notes, undefined);
  assert.equal(payload.plage_horaire_livraison, undefined);
  assert.deepEqual(payload.details, [
    {
      id_produit: 9,
      quantite: 2,
      prix_unitaire: 150,
      remise: 10,
    },
  ]);
});

test('buildVentePayload conserve une adresse de livraison dédiée si nécessaire', () => {
  const payload = buildVentePayload({
    prospectId: 18,
    campagneId: 5,
    formData: baseFormData,
    items: [],
  });

  assert.equal(payload.adresse_livraison, '20 avenue Victor Hugo');
  assert.equal(payload.code_postal_livraison, '69002');
  assert.equal(payload.ville_livraison, 'Lyon');
  assert.equal(payload.pays_livraison, 'France');
  assert.equal(payload.notes, 'Merci de rappeler avant livraison');
  assert.equal(payload.plage_horaire_livraison, '9h-12h');
});
