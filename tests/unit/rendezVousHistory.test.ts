import assert from 'node:assert/strict';
import test from 'node:test';

import { mapRendezVousToHistoryCardModel } from '../../src/utils/scripts/rendezVousHistory.ts';

test('mapRendezVousToHistoryCardModel priorise les donnees decisionnaire pour l historique client', () => {
  const result = mapRendezVousToHistoryCardModel({
    id_rendez_vous: 91,
    id_agent: 7,
    id_prospect: 42,
    id_campagne: 12,
    date_rdv: '2026-07-03',
    heure_rdv: '14:30:00',
    motif: 'Qualification MMA',
    notes: 'Le prospect veut etre rappele apres analyse de ses garanties.',
    derniere_note_closing: 'Decisionnaire tres receptif, devis attendu.',
    statut: 'planifie',
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-01T10:00:00.000Z',
    prospect: {
      id_prospect: 42,
      nom: 'Durand',
      prenom: 'Claire',
      nom_contact: 'Accueil',
      email: 'contact@durand.fr',
      telephone: '0102030405',
      telephone_contact: '0555443322',
      raison_sociale: 'Durand Conseil',
      decisionnaire_nom: 'Claire Durand',
      decisionnaire_fonction: 'Gerante',
      decisionnaire_email_pro: 'claire.durand@durand.fr',
      statut: 'contacte',
    },
    agent: {
      id_employe: 7,
      nom: 'Martin',
      prenom: 'Sophie',
      email: 's.martin@antl.fr',
    },
    campagne: {
      id_campagne: 12,
      nom_campagne: 'MMA Bordeaux',
      type_campagne: 'lead_b2b',
    },
    appelsSource: [],
  });

  assert.equal(result.interlocuteurNom, 'Claire Durand');
  assert.equal(result.interlocuteurRole, 'Gerante');
  assert.equal(result.telephone, '0555443322');
  assert.equal(result.email, 'claire.durand@durand.fr');
  assert.equal(result.campagneLabel, 'MMA Bordeaux');
  assert.equal(result.agentLabel, 'Sophie Martin');
  assert.equal(result.statutLabel, 'Planifie');
});

test('mapRendezVousToHistoryCardModel priorise le snapshot du rendez-vous sur la fiche prospect courante', () => {
  const result = mapRendezVousToHistoryCardModel({
    id_rendez_vous: 93,
    id_agent: 7,
    id_prospect: 42,
    id_campagne: 12,
    date_rdv: '2026-07-03',
    heure_rdv: '16:00:00',
    motif: 'Prise de rendez-vous client',
    interlocuteur_nom: 'Marie Snapshot',
    interlocuteur_role: 'Office manager',
    telephone_contact_snapshot: '0666777888',
    email_contact_snapshot: 'marie.snapshot@durand.fr',
    notes: 'Snapshot saisi lors de la prise de rendez-vous.',
    derniere_note_closing: null,
    statut: 'planifie',
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-01T10:00:00.000Z',
    prospect: {
      id_prospect: 42,
      nom: 'Durand',
      prenom: 'Claire',
      nom_contact: 'Ancien accueil',
      email: 'contact@durand.fr',
      telephone: '0102030405',
      telephone_contact: '0555443322',
      raison_sociale: 'Durand Conseil',
      decisionnaire_nom: 'Claire Durand',
      decisionnaire_fonction: 'Gerante',
      decisionnaire_email_pro: 'claire.durand@durand.fr',
      statut: 'contacte',
    },
    agent: {
      id_employe: 7,
      nom: 'Martin',
      prenom: 'Sophie',
      email: 's.martin@antl.fr',
    },
    campagne: {
      id_campagne: 12,
      nom_campagne: 'MMA Bordeaux',
      type_campagne: 'lead_b2b',
    },
    appelsSource: [],
  });

  assert.equal(result.interlocuteurNom, 'Marie Snapshot');
  assert.equal(result.interlocuteurRole, 'Office manager');
  assert.equal(result.telephone, '0666777888');
  assert.equal(result.email, 'marie.snapshot@durand.fr');
});

test('mapRendezVousToHistoryCardModel retombe sur les champs prospect historiques en fallback', () => {
  const result = mapRendezVousToHistoryCardModel({
    id_rendez_vous: 92,
    id_agent: 8,
    id_prospect: 43,
    id_campagne: 7,
    date_rdv: '2026-07-04',
    heure_rdv: '09:15:00',
    motif: null,
    notes: null,
    derniere_note_closing: null,
    statut: 'non_honore',
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-01T10:00:00.000Z',
    prospect: {
      id_prospect: 43,
      nom: 'Bernard',
      prenom: 'Luc',
      nom_contact: 'Luc Bernard',
      email: 'luc@bernard.fr',
      telephone: '0102030405',
      telephone_contact: null,
      raison_sociale: null,
      decisionnaire_nom: null,
      decisionnaire_fonction: null,
      decisionnaire_email_pro: null,
      statut: 'contacte',
    },
    agent: {
      id_employe: 8,
      nom: 'Dupont',
      prenom: null,
      email: 'dupont@antl.fr',
    },
    campagne: {
      id_campagne: 7,
      nom_campagne: 'Les Cigales',
      type_campagne: 'vente',
    },
    appelsSource: [],
  });

  assert.equal(result.interlocuteurNom, 'Luc Bernard');
  assert.equal(result.interlocuteurRole, null);
  assert.equal(result.telephone, '0102030405');
  assert.equal(result.email, 'luc@bernard.fr');
  assert.equal(result.agentLabel, 'Dupont');
  assert.equal(result.statutLabel, 'Non honore');
});
