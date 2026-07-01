import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAMPAIGN_VARIANTS,
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
    ['Historique appels', 'Historique rendez-vous', 'Agenda', 'Prise de rendez-vous'],
  );
  assert.equal(config.actions.find((action) => action.id === 'historique-offres')?.targetView, 'historique-rendez-vous');
});
