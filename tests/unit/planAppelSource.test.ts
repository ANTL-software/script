import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getStaticPlanAppelForCampaign,
  shouldForceLegacyStaticPlanAppel,
} from '../../src/utils/scripts/planAppelSource.ts';
import { CAMPAIGN_VARIANTS } from '../../src/utils/scripts/campaignVariants.ts';

test('shouldForceLegacyStaticPlanAppel force le plan hardcode pour Les Cigales', () => {
  assert.equal(
    shouldForceLegacyStaticPlanAppel({
      id_campagne: 7,
      type_campagne: CAMPAIGN_VARIANTS.vente,
      nom_campagne: 'Les Cigales',
    }),
    true,
  );

  assert.equal(
    shouldForceLegacyStaticPlanAppel({
      id_campagne: 42,
      type_campagne: CAMPAIGN_VARIANTS.vente,
      nom_campagne: 'Campagne Cigales Test',
    }),
    true,
  );
});

test('shouldForceLegacyStaticPlanAppel ne force pas MMA', () => {
  assert.equal(
    shouldForceLegacyStaticPlanAppel({
      id_campagne: 9,
      type_campagne: CAMPAIGN_VARIANTS.lead_b2b,
      nom_campagne: 'MMA Planete Assurance',
    }),
    false,
  );
});

test('getStaticPlanAppelForCampaign retourne bien le plan historique Cigales et le plan MMA', () => {
  const cigalesPlan = getStaticPlanAppelForCampaign({
    id_campagne: 7,
    type_campagne: CAMPAIGN_VARIANTS.vente,
    nom_campagne: 'Les Cigales',
  });
  const mmaPlan = getStaticPlanAppelForCampaign({
    id_campagne: 9,
    type_campagne: CAMPAIGN_VARIANTS.lead_b2b,
    nom_campagne: 'MMA Planete Assurance',
  });

  assert.equal(cigalesPlan[0]?.titre, 'IDENTIFICATION - Obtenir le nom du décisionnaire');
  assert.equal(cigalesPlan[4]?.titre, 'COMMANDE – Transformer l’accord de principe en commande ferme');
  assert.equal(mmaPlan[0]?.titre, 'IDENTIFICATION - Obtenir le nom du décisionnaire');
  assert.equal(mmaPlan[4]?.titre, 'COMMANDE – Transformer l’accord de principe en RDV ferme');
});
