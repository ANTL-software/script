import { expect, test } from '@playwright/test';

interface ProspectContractResult {
  statut: string;
  typeFiche: string;
  mmaLabels: string[];
  mmaCommandeMode: string;
}

test('le contrat client priorise statut_campagne et expose la variante MMA attendue', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async (): Promise<ProspectContractResult> => {
    const [{ ProspectModel }, { getCampaignUiConfig }] = await Promise.all([
      import('/src/API/models/Prospect.model.ts'),
      import('/src/utils/scripts/campaignVariants.ts'),
    ]);

    const prospect = ProspectModel.fromJSON({
      id_prospect: 1,
      type_prospect: 'Entreprise',
      nom: 'Durand',
      raison_sociale: 'Durand Conseil',
      telephone: '0102030405',
      statut: 'nouveau',
      statut_campagne: 'non_interesse',
      max_progpa: 0,
      created_at: '2026-07-01T10:00:00.000Z',
      updated_at: '2026-07-01T10:00:00.000Z',
    });

    const ui = getCampaignUiConfig({
      id_campagne: 7,
      nom_campagne: 'MMA',
      type_campagne: 'lead_b2b',
      statut: 'active',
    });

    return {
      statut: prospect.statut,
      typeFiche: prospect.typeFiche,
      mmaLabels: ui.actions.map((action) => action.label),
      mmaCommandeMode: ui.commandeMode,
    };
  });

  expect(result.statut).toBe('non_interesse');
  expect(result.typeFiche).toBe('recycle');
  expect(result.mmaLabels).toEqual([
    'Historique appels',
    'Historique rendez-vous',
    'Agenda',
    'Prise de rendez-vous',
  ]);
  expect(result.mmaCommandeMode).toBe('placeholder');
});

test('la variante vente conserve la matrice historique attendue', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async () => {
    const { getCampaignUiConfig } = await import('/src/utils/scripts/campaignVariants.ts');

    const ui = getCampaignUiConfig({
      id_campagne: 2,
      nom_campagne: 'Les Cigales',
      type_campagne: 'vente',
      statut: 'active',
    });

    return {
      labels: ui.actions.map((action) => action.label),
      commandeMode: ui.commandeMode,
    };
  });

  expect(result.labels).toEqual([
    'Tarifs',
    'Agrément',
    'Historique appels',
    'Historique offres',
    'Rendez-vous',
    'Commande',
  ]);
  expect(result.commandeMode).toBe('sales');
});
