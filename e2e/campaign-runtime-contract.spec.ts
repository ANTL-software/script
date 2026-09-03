import { expect, test } from '@playwright/test';

interface ProspectContractResult {
  statut: string;
  typeFiche: string;
  mmaLabels: string[];
  mmaCommandeMode: string;
  mmaClosingStatuts: string[];
  mmaClosingLabels: string[];
  mmaProgpaTopLabel: string | null;
}

test('le contrat client priorise statut_campagne et expose la variante MMA attendue', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async (): Promise<ProspectContractResult> => {
    const [{ ProspectModel }, { getCampaignClosingOptions, getCampaignProgpaSteps, getCampaignUiConfig }] = await Promise.all([
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
      mmaClosingStatuts: ui.closingStatuts,
      mmaClosingLabels: getCampaignClosingOptions({
        type_campagne: 'lead_b2b',
      }).map((option) => option.label),
      mmaProgpaTopLabel: getCampaignProgpaSteps('lead_b2b').at(0)?.label ?? null,
    };
  });

  expect(result.statut).toBe('non_interesse');
  expect(result.typeFiche).toBe('recycle');
  expect(result.mmaLabels).toEqual([
    'Historique appels',
    'Historique rendez-vous',
    'Agenda personnel',
    'Prise de rendez-vous client',
  ]);
  expect(result.mmaCommandeMode).toBe('placeholder');
  expect(result.mmaClosingStatuts).toEqual([
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
  ]);
  expect(result.mmaClosingLabels.slice(0, 2)).toEqual([
    'Rendez-vous validé !',
    'Relance',
  ]);
  expect(result.mmaProgpaTopLabel).toBe('Commande');
});

test('le contrat runtime du script preserve la priorite Cigales sans switch explicite', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async () => {
    const { pickRuntimeCampaign, resolveManualCallOrigin } = await import('/src/utils/scripts/runtimeCampaign.ts');

    const campaigns = [
      {
        id_campagne: 7,
        nom_campagne: 'Les Cigales',
        type_campagne: 'vente',
        statut: 'active',
        autoriser_mobile: false,
      },
      {
        id_campagne: 9,
        nom_campagne: 'MMA',
        type_campagne: 'lead_b2b',
        statut: 'active',
        autoriser_mobile: false,
        is_active_runtime: true,
      },
    ];

    return {
      ficheActive: pickRuntimeCampaign(campaigns, 7, 9)?.id_campagne ?? null,
      backendRuntime: pickRuntimeCampaign(campaigns, null, null)?.id_campagne ?? null,
      outgoingReminderOrigin: resolveManualCallOrigin(91),
      outgoingManualOrigin: resolveManualCallOrigin(undefined),
    };
  });

  expect(result.ficheActive).toBe(7);
  expect(result.backendRuntime).toBe(9);
  expect(result.outgoingReminderOrigin).toBe('rappel');
  expect(result.outgoingManualOrigin).toBe('manuel');
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
      closingStatuts: ui.closingStatuts,
    };
  });

  expect(result.labels).toEqual([
    'Plaquette',
    'Tarifs',
    'Historique appels',
    'Historique offres',
    'Rendez-vous',
    'Commande',
  ]);
  expect(result.commandeMode).toBe('sales');
  expect(result.closingStatuts).toEqual([
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
  ]);
});

test('les relances Cigales et MMA exigent un rappel agenda sans confondre le rendez-vous client MMA', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async () => {
    const {
      getCampaignAgendaRendezVousMotif,
      requiresCampaignAgendaRendezVous,
    } = await import('/src/utils/scripts/campaignVariants.ts');

    return {
      cigales: {
        required: requiresCampaignAgendaRendezVous('vente', 'relance'),
        motif: getCampaignAgendaRendezVousMotif('vente', 'relance'),
      },
      cigalesRendezVousPris: {
        required: requiresCampaignAgendaRendezVous('vente', 'rendez_vous_pris'),
        motif: getCampaignAgendaRendezVousMotif('vente', 'rendez_vous_pris'),
      },
      mmaRelance: {
        required: requiresCampaignAgendaRendezVous('lead_b2b', 'rdv_pris'),
        motif: getCampaignAgendaRendezVousMotif('lead_b2b', 'rdv_pris'),
      },
      mmaRendezVousClient: {
        required: requiresCampaignAgendaRendezVous('lead_b2b', 'rendez_vous_pris'),
        motif: getCampaignAgendaRendezVousMotif('lead_b2b', 'rendez_vous_pris'),
      },
    };
  });

  expect(result.cigales).toEqual({ required: true, motif: 'Relance' });
  expect(result.cigalesRendezVousPris).toEqual({ required: true, motif: 'Rendez-vous pris' });
  expect(result.mmaRelance).toEqual({ required: true, motif: 'Relance' });
  expect(result.mmaRendezVousClient).toEqual({ required: false, motif: null });
});

test('le contrat de commande vente transporte id_appel sans casser le mode placeholder MMA', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async () => {
    const [{ buildVentePayload }, { getCampaignUiConfig }] = await Promise.all([
      import('/src/utils/scripts/orderValidation.ts'),
      import('/src/utils/scripts/campaignVariants.ts'),
    ]);

    const payload = buildVentePayload({
      prospectId: 44,
      campagneId: 2,
      appelId: 91,
      formData: {
        adresse_facturation: '1 rue Test',
        adresse_livraison: '1 rue Test',
        code_postal_facturation: '75001',
        code_postal_livraison: '75001',
        ville_facturation: 'Paris',
        ville_livraison: 'Paris',
        pays_facturation: 'France',
        pays_livraison: 'France',
        meme_adresse: true,
        mode_paiement: 'Cheque',
        notes: '',
        delais_livraison: 2,
        civilite: 'Mme',
        nom_contact: 'Durand',
        plage_horaire_livraison: '',
        livraison_offerte: false,
      },
      items: [],
    });

    const mmaUi = getCampaignUiConfig({
      id_campagne: 7,
      nom_campagne: 'MMA',
      type_campagne: 'lead_b2b',
      statut: 'active',
    });

    return {
      payload,
      mmaCommandeMode: mmaUi.commandeMode,
      mmaCommandeLabel: mmaUi.actions.find((action) => action.id === 'commande')?.label ?? null,
    };
  });

  expect(result.payload.id_appel).toBe(91);
  expect(result.payload.id_campagne).toBe(2);
  expect(result.mmaCommandeMode).toBe('placeholder');
  expect(result.mmaCommandeLabel).toBe('Prise de rendez-vous client');
});
