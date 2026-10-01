import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildLeadB2BRendezVousPayload,
  buildGoogleBookingCopyFields,
  filterAvailableLeadB2BTimeSlots,
  formatLeadB2BDateLabel,
  getLeadB2BRendezVousPrefill,
  getLeadB2BTimeSlots,
  getLeadBookingTimeSlots,
  hasFixedLeadBookingTimes,
  isLeadBookingTimeAllowed,
  getLeadExternalBookingConfig,
  getLeadBookingCalendarDays,
  getLeadBookingOpenWeekdays,
  isLeadB2BTimeSlotUnavailable,
  getTodayInputDateString,
  isLeadB2BDateAllowed,
  LEAD_B2B_RENDEZ_VOUS_MOTIF,
  supportsMmaEmployeeCountQualification,
} from '../../src/utils/scripts/priseRendezVous.ts';

test('la campagne Caillibotte Zoe-Noe utilise son agenda Google public', () => {
  const expectedScheduleId = 'AcZssZ2g-7ShOEU4D0P8UTqNcVfqSVFEWngmxEwoJ4ixGGETJRm75H3Jda2KR5cd0O56KSBzT7vWc8Jo';

  const canonicalConfig = getLeadExternalBookingConfig({ nom_campagne: 'CAILLIBOTTE ZOE-NOE' });
  const suppliedSpellingConfig = getLeadExternalBookingConfig({ nom_campagne: 'CAILLIBOTE ZOÉ-NOÉ' });
  const deployedShortNameConfig = getLeadExternalBookingConfig({ nom_campagne: 'zoenoe' });

  assert.equal(canonicalConfig?.provider, 'google_appointment_schedule');
  assert.match(canonicalConfig?.embedUrl ?? '', new RegExp(`${expectedScheduleId}\\?gv=true$`));
  assert.equal(suppliedSpellingConfig?.bookingUrl.includes(expectedScheduleId), true);
  assert.equal(deployedShortNameConfig?.bookingUrl.includes(expectedScheduleId), true);
  assert.equal(getLeadExternalBookingConfig({ nom_campagne: 'FGA Consulting' }), null);
});

test('les valeurs de la fiche prospect sont préparées dans l ordre du formulaire Google', () => {
  const fields = buildGoogleBookingCopyFields({
    prospect: {
      id_prospect: 3,
      type_prospect: 'Entreprise',
      nom: 'Martin',
      raison_sociale: 'Atelier Martin',
      siret: '12345678900012',
      telephone: '0102030405',
      statut: 'nouveau',
      max_progpa: 0,
      created_at: '2026-09-15T08:00:00.000Z',
      updated_at: '2026-09-15T08:00:00.000Z',
    },
    interlocuteurNom: ' Zoé Martin ',
    telephone: ' 0611223344 ',
    email: ' zoe@atelier.fr ',
  });

  assert.deepEqual(fields.map(({ key, value }) => ({ key, value })), [
    { key: 'contact_name', value: 'Zoé Martin' },
    { key: 'email', value: 'zoe@atelier.fr' },
    { key: 'phone', value: '0611223344' },
    { key: 'siret', value: '12345678900012' },
    { key: 'company', value: 'Atelier Martin' },
  ]);
});

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
    campagneId: 10,
    dateRdv: '2026-07-07',
    timeValue: '10:15',
    interlocuteurNom: ' Claire Durand ',
    interlocuteurRole: ' Directrice generale ',
    telephone: ' 0555443322 ',
    email: ' claire.durand@durand.fr ',
    notes: ' A rappeler pour qualification MMA. ',
    entreprisePlusDeCinqSalaries: true,
  });

  assert.deepEqual(payload, {
    id_prospect: 42,
    id_campagne: 10,
    date_rdv: '2026-07-07',
    heure_rdv: '10:15:00',
    motif: LEAD_B2B_RENDEZ_VOUS_MOTIF,
    interlocuteur_nom: 'Claire Durand',
    interlocuteur_role: 'Directrice generale',
    telephone_contact_snapshot: '0555443322',
    email_contact_snapshot: 'claire.durand@durand.fr',
    entreprise_plus_de_cinq_salaries: true,
    notes: 'A rappeler pour qualification MMA.',
  });
});

test('la qualification du nombre de salariés est réservée à la campagne MMA', () => {
  assert.equal(supportsMmaEmployeeCountQualification({ id_campagne: 10 }), true);
  assert.equal(supportsMmaEmployeeCountQualification({ id_campagne: 11 }), false);
  assert.equal(supportsMmaEmployeeCountQualification({ id_campagne: 12 }), false);
  assert.equal(supportsMmaEmployeeCountQualification(null), false);

  const fgaPayload = buildLeadB2BRendezVousPayload({
    prospectId: 42,
    campagneId: 11,
    dateRdv: '2026-09-08',
    timeValue: '14:15',
    interlocuteurNom: 'Camille Martin',
    interlocuteurRole: 'Direction',
    telephone: '0140203040',
    email: 'camille.martin@atelier-horizon.fr',
    notes: 'Recrutement en cours',
    entreprisePlusDeCinqSalaries: true,
  });

  assert.equal(fgaPayload.entreprise_plus_de_cinq_salaries, false);
});

test('les jours ouverts de campagne filtrent les dates de rendez-vous client', () => {
  const openWeekdays = getLeadBookingOpenWeekdays({
    bon_commande_config: { lead_booking: { open_weekdays: [1, 4] } },
  });

  assert.deepEqual(openWeekdays, [1, 4]);
  assert.equal(isLeadB2BDateAllowed('2026-07-07'), true);
  assert.equal(isLeadB2BDateAllowed('2026-07-09', openWeekdays), true);
  assert.equal(isLeadB2BDateAllowed('2026-07-08', openWeekdays), false);
  assert.equal(isLeadB2BDateAllowed('2026-07-12', openWeekdays), false);
  assert.equal(isLeadB2BDateAllowed(''), false);

  const julyDays = getLeadBookingCalendarDays(new Date(2026, 6, 1), '2026-07-01', openWeekdays);
  assert.equal(julyDays.find((day) => day?.isoDate === '2026-07-08')?.disabled, true);
  assert.equal(julyDays.find((day) => day?.isoDate === '2026-07-09')?.disabled, false);
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

for (const id_campagne of [12, 14]) {
  test(`Swiss Life ${id_campagne}: seuls les débuts des plages du jour sont proposés`, () => {
    const campaign = { id_campagne };
    assert.equal(hasFixedLeadBookingTimes(campaign), true);
    for (const date of ['2026-10-05', '2026-10-08']) {
      assert.deepEqual(getLeadBookingTimeSlots(campaign, date), [
        { value: '10:00', label: '10:00 – 11:00' },
        { value: '14:00', label: '14:00 – 15:00' },
        { value: '17:00', label: '17:00 – 18:00' },
      ]);
    }
    assert.deepEqual(getLeadBookingTimeSlots(campaign, '2026-10-06'), [
      { value: '09:00', label: '09:00 – 10:00' },
      { value: '13:00', label: '13:00 – 14:00' },
      { value: '16:00', label: '16:00 – 17:00' },
    ]);
    for (const date of ['', '2026-02-30', '2026-10-07', '2026-10-09', '2026-10-10', '2026-10-11']) {
      assert.deepEqual(getLeadBookingTimeSlots(campaign, date), []);
    }
    const available = filterAvailableLeadB2BTimeSlots(getLeadBookingTimeSlots(campaign, '2026-10-05'), ['14:00:00']);
    assert.deepEqual(available.map((slot) => slot.value), ['10:00', '17:00']);
  });

  test(`Swiss Life ${id_campagne}: une saisie manuelle ou conservée d'un autre jour ne contourne pas les horaires`, () => {
    const campaign = { id_campagne };
    assert.equal(isLeadBookingTimeAllowed(campaign, '2026-10-05', '10:00:00'), true);
    assert.equal(isLeadBookingTimeAllowed(campaign, '2026-10-06', '9:00'), true);
    for (const time of ['09:00', '10:15', '11:00', '10:00:01', '18:00']) {
      assert.equal(isLeadBookingTimeAllowed(campaign, '2026-10-05', time), false);
    }
    assert.equal(isLeadBookingTimeAllowed(campaign, '2026-10-06', '10:00'), false);
    assert.equal(isLeadBookingTimeAllowed(campaign, '2026-10-07', '10:00'), false);
  });
}

test('les autres campagnes conservent leurs horaires et leur saisie libre', () => {
  const campaign = { id_campagne: 10 };
  assert.equal(hasFixedLeadBookingTimes(campaign), false);
  assert.deepEqual(getLeadBookingTimeSlots(campaign, '2026-10-05'), getLeadB2BTimeSlots());
  assert.equal(isLeadBookingTimeAllowed(campaign, '2026-10-05', '10:15'), true);
});
