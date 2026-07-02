import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAMPAIGN_VARIANTS,
  getCampaignClosingOptions,
  getCampaignProgpaSteps,
  getCampaignUiConfig,
  normalizeCampaignVariant,
} from '../../src/utils/scripts/campaignVariants.ts';

test('normalizeCampaignVariant applique un fallback vente', () => {
  assert.equal(normalizeCampaignVariant(CAMPAIGN_VARIANTS.vente), CAMPAIGN_VARIANTS.vente);
  assert.equal(normalizeCampaignVariant(CAMPAIGN_VARIANTS.lead_b2b), CAMPAIGN_VARIANTS.lead_b2b);
  assert.equal(normalizeCampaignVariant('legacy'), CAMPAIGN_VARIANTS.vente);
  assert.equal(normalizeCampaignVariant(undefined), CAMPAIGN_VARIANTS.vente);
});

test('getCampaignUiConfig retourne la matrice vente attendue', () => {
  const config = getCampaignUiConfig({ type_campagne: CAMPAIGN_VARIANTS.vente });

  assert.equal(config.showPaniers, true);
  assert.equal(config.commandeMode, 'sales');
  assert.deepEqual(
    config.actions.map((action) => action.label),
    ['Tarifs', 'Agrément', 'Historique appels', 'Historique offres', 'Rendez-vous', 'Commande'],
  );
});

test('getCampaignUiConfig retourne la matrice MMA attendue', () => {
  const config = getCampaignUiConfig({ type_campagne: CAMPAIGN_VARIANTS.lead_b2b });

  assert.equal(config.showPaniers, false);
  assert.equal(config.commandeMode, 'placeholder');
  assert.deepEqual(
    config.actions.map((action) => action.label),
    ['Historique appels', 'Historique rendez-vous', 'Agenda personnel', 'Prise de rendez-vous client'],
  );
  assert.equal(config.actions.find((action) => action.id === 'historique-offres')?.targetView, 'historique-rendez-vous');
});

test('getCampaignClosingOptions conserve le closing vente historique pour Cigales', () => {
  const options = getCampaignClosingOptions({ type_campagne: CAMPAIGN_VARIANTS.vente });

  assert.deepEqual(
    options.map((option) => option.value),
    [
      'vente_conclue',
      'relance',
      'rdv_pris',
      'rendez_vous_pris',
      'abouti',
      'pas_disponible',
      'repondeur',
      'non_abouti',
      'refus_definitif',
      'siege',
      'faillite',
      'pas_attribue',
      'particulier',
      'doublon',
    ],
  );
});

test('getCampaignClosingOptions retire les statuts purement vente pour MMA', () => {
  const options = getCampaignClosingOptions({ type_campagne: CAMPAIGN_VARIANTS.lead_b2b });

  assert.deepEqual(
    options.map((option) => option.value),
    [
      'rendez_vous_pris',
      'rdv_pris',
      'abouti',
      'pas_disponible',
      'repondeur',
      'non_abouti',
      'refus_definitif',
      'siege',
      'faillite',
      'pas_attribue',
      'particulier',
      'doublon',
    ],
  );
  assert.equal(options[0]?.label, 'Rendez-vous validé !');
  assert.equal(options[1]?.label, 'Relance');
  assert.notEqual(options[0]?.icon, options[1]?.icon);
  assert.notEqual(options[1]?.icon, options.find((option) => option.value === 'pas_disponible')?.icon);
});

test('getCampaignProgpaSteps adapte le libelle final pour MMA sans toucher Cigales', () => {
  assert.equal(getCampaignProgpaSteps(CAMPAIGN_VARIANTS.vente)[0]?.label, 'Commande');
  assert.equal(getCampaignProgpaSteps(CAMPAIGN_VARIANTS.lead_b2b)[0]?.label, 'Rendez-vous pris');
});
