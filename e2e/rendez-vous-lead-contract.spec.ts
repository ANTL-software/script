import { expect, test } from '@playwright/test';

test('le contrat MMA persiste et relit les snapshots de prise de rendez-vous client', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async () => {
    const [{ buildLeadB2BRendezVousPayload }, { mapRendezVousToHistoryCardModel }, { getCampaignClosingOptions }] = await Promise.all([
      import('/src/utils/scripts/priseRendezVous.ts'),
      import('/src/utils/scripts/rendezVousHistory.ts'),
      import('/src/utils/scripts/campaignVariants.ts'),
    ]);

    const payload = buildLeadB2BRendezVousPayload({
      prospectId: 42,
      campagneId: 7,
      dateRdv: '2026-07-07',
      timeValue: '10:15',
      interlocuteurNom: 'Claire Durand',
      interlocuteurRole: 'Directrice generale',
      telephone: '0555443322',
      email: 'claire.durand@durand.fr',
      notes: 'Qualification MMA a finaliser',
    });

    const historyCard = mapRendezVousToHistoryCardModel({
      id_lead: 1,
      id_agent: 7,
      id_prospect: 42,
      id_campagne: 7,
      date_rdv: '2026-07-07',
      heure_rdv: '10:15:00',
      motif: 'Prise de rendez-vous client',
      interlocuteur_nom: 'Claire Snapshot',
      interlocuteur_role: 'Office manager',
      telephone_contact_snapshot: '0666777888',
      email_contact_snapshot: 'snapshot@durand.fr',
      notes: 'Snapshot prioritaire',
      derniere_note_closing: null,
      statut: 'planifie',
      created_at: '2026-07-01T10:00:00.000Z',
      updated_at: '2026-07-01T10:00:00.000Z',
      prospect: {
        id_prospect: 42,
        nom: 'Durand',
        prenom: 'Claire',
        nom_contact: 'Accueil Durand',
        email: 'contact@durand.fr',
        telephone: '0102030405',
        telephone_contact: '0555443322',
        raison_sociale: 'Durand Conseil',
        decisionnaire_nom: 'Claire Prospect',
        decisionnaire_fonction: 'Gerante',
        decisionnaire_email_pro: 'prospect@durand.fr',
        statut: 'contacte',
      },
      agent: {
        id_employe: 7,
        nom: 'Martin',
        prenom: 'Sophie',
        email: 's.martin@antl.fr',
      },
      campagne: {
        id_campagne: 7,
        nom_campagne: 'MMA',
        type_campagne: 'lead_b2b',
      },
      appelsSource: [],
    });

    return {
      payload,
      historyCard,
      mmaClosingLabels: getCampaignClosingOptions({ type_campagne: 'lead_b2b' }).map((option) => option.label),
    };
  });

  expect(result.payload).toEqual({
    id_prospect: 42,
    id_campagne: 7,
    date_rdv: '2026-07-07',
    heure_rdv: '10:15:00',
    motif: 'Prise de rendez-vous client',
    interlocuteur_nom: 'Claire Durand',
    interlocuteur_role: 'Directrice generale',
    telephone_contact_snapshot: '0555443322',
    email_contact_snapshot: 'claire.durand@durand.fr',
    notes: 'Qualification MMA a finaliser',
  });

  expect(result.historyCard.interlocuteurNom).toBe('Claire Snapshot');
  expect(result.historyCard.interlocuteurRole).toBe('Office manager');
  expect(result.historyCard.telephone).toBe('0666777888');
  expect(result.historyCard.email).toBe('snapshot@durand.fr');
  expect(result.mmaClosingLabels.slice(0, 2)).toEqual([
    'Rendez-vous validé !',
    'Relance',
  ]);
});
