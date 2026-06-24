import assert from 'node:assert/strict';
import test from 'node:test';

import {
  cleanAndValidatePhone,
  formatDuration,
  formatDurationFromSeconds,
  formatDurationLong,
  formatPhoneE164,
  formatProspectName,
  getErrorMessage,
  getStatutAppelClass,
  getStatutAppelLabel,
  isMobilePhone,
  checkIsCommande,
} from '../../src/utils/scripts/formatters.ts';

test('formatDuration formate les minutes et secondes', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(65), '1:05');
});

test('formatDurationLong gère les formats courts et longs', () => {
  assert.equal(formatDurationLong(45), '45 sec');
  assert.equal(formatDurationLong(120), '2 min');
  assert.equal(formatDurationLong(125), '2 min 5 sec');
});

test('cleanAndValidatePhone nettoie les séparateurs usuels et rejette les formats trop courts', () => {
  assert.equal(cleanAndValidatePhone(' 06 12 34 56 78 '), '0612345678');
  assert.equal(cleanAndValidatePhone('+33 (0)1 23 45 67 89'), '+330123456789');
  assert.equal(cleanAndValidatePhone('12-34'), null);
});

test('formatPhoneE164 convertit correctement les formats français', () => {
  assert.equal(formatPhoneE164('06 12 34 56 78'), '+33612345678');
  assert.equal(formatPhoneE164('33612345678'), '+33612345678');
  assert.equal(formatPhoneE164('+44 20 7946 0958'), '+442079460958');
});

test('isMobilePhone identifie les mobiles français', () => {
  assert.equal(isMobilePhone('06 12 34 56 78'), true);
  assert.equal(isMobilePhone('+33 7 12 34 56 78'), true);
  assert.equal(isMobilePhone('01 23 45 67 89'), false);
});

test('formatProspectName privilégie la raison sociale pour une entreprise', () => {
  assert.equal(
    formatProspectName({
      nom: 'Martin',
      prenom: 'Alice',
      raison_sociale: 'ACME SAS',
      type_prospect: 'Entreprise',
    }),
    'ACME SAS'
  );

  assert.equal(
    formatProspectName({
      nom: 'Martin',
      prenom: 'Alice',
    }),
    'Alice Martin'
  );
});

test('formatDurationFromSeconds retourne N/A pour les valeurs nulles ou null-ish', () => {
  assert.equal(formatDurationFromSeconds(null), 'N/A');
  assert.equal(formatDurationFromSeconds(0), 'N/A');
  assert.equal(formatDurationFromSeconds(125), '2m 5s');
});

test('getErrorMessage extrait un message fiable', () => {
  assert.equal(getErrorMessage(new Error('boom')), 'boom');
  assert.equal(getErrorMessage('erreur brute'), 'erreur brute');
  assert.equal(getErrorMessage({}), 'Une erreur est survenue');
  assert.equal(getErrorMessage({}, 'fallback'), 'fallback');
});

test('les helpers de statut d’appel renvoient les classes et labels attendus', () => {
  assert.equal(getStatutAppelClass('vente_conclue'), 'appel-card__statut--success');
  assert.equal(getStatutAppelClass('rendez_vous_pris'), 'appel-card__statut--success');
  assert.equal(getStatutAppelClass('repondeur'), 'appel-card__statut--warning');
  assert.equal(getStatutAppelClass('amd_repondeur_auto'), 'appel-card__statut--warning');
  assert.equal(getStatutAppelClass('amd_machine_start_auto'), 'appel-card__statut--warning');
  assert.equal(getStatutAppelClass('optout'), 'appel-card__statut--danger');
  assert.equal(getStatutAppelClass('inconnu'), '');

  assert.equal(getStatutAppelLabel('rdv_pris'), 'Commande à établir');
  assert.equal(getStatutAppelLabel('fax'), 'Fax');
  assert.equal(getStatutAppelLabel('amd_fax_auto'), 'Fax auto coupé');
  assert.equal(getStatutAppelLabel('amd_machine_start_auto'), 'Automate filtré auto');
  assert.equal(getStatutAppelLabel('inconnu'), 'inconnu');
});

test('checkIsCommande détecte les motifs liés à une commande', () => {
  // Test avec selectedCallStatus
  assert.equal(checkIsCommande(null, null, 'rdv_pris'), true);
  assert.equal(checkIsCommande('cde', null, 'rendez_vous_pris'), false); // Le statut de classification explicite l'emporte !
  assert.equal(checkIsCommande(null, null, 'abouti'), false);

  // Test avec appelsSource
  assert.equal(checkIsCommande(null, [{ statut_appel: 'rdv_pris' }]), true);
  assert.equal(checkIsCommande(null, [{ statut_appel: 'rendez_vous_pris' }]), false);
  assert.equal(checkIsCommande('Rendez-vous', [{ statut_appel: 'rdv_pris' }]), true); // Le statut de l'appel l'emporte sur le motif !

  // Commandes valides (motif fallback)
  assert.equal(checkIsCommande('Commande à établir'), true);
  assert.equal(checkIsCommande('commande a etablir'), true);
  assert.equal(checkIsCommande('cde'), true);
  assert.equal(checkIsCommande('CDE'), true);
  assert.equal(checkIsCommande('cde ?'), true);
  assert.equal(checkIsCommande('peut etre cde'), true);
  assert.equal(checkIsCommande('relance cde'), true);
  assert.equal(checkIsCommande('MME POULAIN COMMANDE A FAIRE'), true);
  
  // Non commandes (motif fallback)
  assert.equal(checkIsCommande(null), false);
  assert.equal(checkIsCommande(undefined), false);
  assert.equal(checkIsCommande(''), false);
  assert.equal(checkIsCommande('Rendez-vous'), false);
  assert.equal(checkIsCommande('abs'), false);
  assert.equal(checkIsCommande('décider'), false);
});
