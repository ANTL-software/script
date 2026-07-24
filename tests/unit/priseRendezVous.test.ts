import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildLeadB2BRendezVousPayload,
  filterAvailableLeadB2BTimeSlots,
  formatLeadB2BDateLabel,
  getLeadB2BRendezVousPrefill,
  getLeadB2BTimeSlots,
  isLeadB2BTimeSlotUnavailable,
  getTodayInputDateString,
  isLeadB2BDateAllowed,
  LEAD_B2B_RENDEZ_VOUS_MOTIF,
} from '../../src/utils/scripts/priseRendezVous.ts';

test('getLeadB2BRendezVousPrefill priorise les donnees decisionnaire pour le formulaire MMA', () => {
  const prefill = getLeadB2BRendezVousPrefill({
    id_prospect: 1,
    type_prospect: 'Entreprise',
    nom: 'Durand',
    prenom: 'Claire',
    raison_sociale: 'Durand Conseil',
    telephone: '0102030405',
    telephone_contact: '0555443322',
    email: 'contact@durand.fr',
    nom_contact: 'Accueil Durand',
    decisionnaire_nom: 'Claire Durand',
    decisionnaire_fonction: 'Gerante',
    decisionnaire_email_pro: 'claire.durand@durand.fr',
    statut: 'nouveau',
    max_progpa: 0,
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-01T10:00:00.000Z',
  });

  assert.deepEqual(prefill, {
    interlocuteurNom: 'Claire Durand',
    interlocuteurRole: 'Gerante',
    telephone: '0555443322',
    email: 'claire.durand@durand.fr',
  });
});

test('getLeadB2BRendezVousPrefill ne reutilise pas la raison sociale comme interlocuteur par defaut', () => {
  const prefill = getLeadB2BRendezVousPrefill({
    id_prospect: 2,
    type_prospect: 'Entreprise',
    nom: 'Durand',
    prenom: null,
    raison_sociale: 'Durand Conseil',
    telephone: '0102030405',
    telephone_contact: null,
    email: 'contact@durand.fr',
    nom_contact: null,
    decisionnaire_nom: null,
    decisionnaire_fonction: null,
    decisionnaire_email_pro: null,
    statut: 'nouveau',
    max_progpa: 0,
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-01T10:00:00.000Z',
  });

  assert.deepEqual(prefill, {
    interlocuteurNom: '',
    interlocuteurRole: '',
    telephone: '0102030405',
    email: 'contact@durand.fr',
  });
});

test('buildLeadB2BRendezVousPayload construit le payload persistant attendu pour la prise de rendez-vous', () => {
  const payload = buildLeadB2BRendezVousPayload({
    prospectId: 42,
    campagneId: 7,
    dateRdv: '2026-07-07',
    timeValue: '10:15',
    interlocuteurNom: ' Claire Durand ',
    interlocuteurRole: ' Directrice generale ',
    telephone: ' 0555443322 ',
    email: ' claire.durand@durand.fr ',
    notes: ' A rappeler pour qualification MMA. ',
  });

  assert.deepEqual(payload, {
    id_prospect: 42,
    id_campagne: 7,
    date_rdv: '2026-07-07',
    heure_rdv: '10:15:00',
    motif: LEAD_B2B_RENDEZ_VOUS_MOTIF,
    interlocuteur_nom: 'Claire Durand',
    interlocuteur_role: 'Directrice generale',
    telephone_contact_snapshot: '0555443322',
    email_contact_snapshot: 'claire.durand@durand.fr',
    notes: 'A rappeler pour qualification MMA.',
  });
});

test('isLeadB2BDateAllowed n autorise que mardi et jeudi', () => {
  assert.equal(isLeadB2BDateAllowed('2026-07-07'), true);
  assert.equal(isLeadB2BDateAllowed('2026-07-09'), true);
  assert.equal(isLeadB2BDateAllowed('2026-07-08'), false);
});

test('les créneaux déjà réservés sont retirés sans bloquer les heures suivantes', () => {
  const slots = getLeadB2BTimeSlots();
  const availableSlots = filterAvailableLeadB2BTimeSlots(slots, ['09:00:00']);

  assert.equal(availableSlots.some((slot) => slot.value === '09:00'), false);
  assert.equal(availableSlots.some((slot) => slot.value === '09:15'), true);
  assert.equal(availableSlots.some((slot) => slot.value === '10:00'), true);
  assert.equal(isLeadB2BTimeSlotUnavailable('09:00', ['09:00:00']), true);
  assert.equal(isLeadB2BTimeSlotUnavailable('10:00', ['09:00:00']), false);
});

test('les helpers de date gardent un format stable pour le formulaire MMA', () => {
  assert.equal(getTodayInputDateString(new Date(2026, 6, 2)), '2026-07-02');
  assert.match(formatLeadB2BDateLabel('2026-07-07'), /mardi 7 juillet 2026/i);
});
