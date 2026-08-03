import { expect, test, type Page, type Route } from '@playwright/test';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface EmployeFixture {
  id_employe: number;
  identifiant: string;
  nom: string;
  prenom: string;
  email: string;
  actif: boolean;
}

interface CampaignFixture {
  id_campagne: number;
  nom_campagne: string;
  type_campagne: 'lead_b2b';
  statut: 'active';
  autoriser_mobile: boolean;
  actif: boolean;
  date_debut: string;
  date_fin: string | null;
  is_active_runtime: boolean;
}

interface ProspectFixture {
  id_prospect: number;
  civilite: string;
  type_prospect: 'Entreprise';
  nom: string;
  prenom: string | null;
  raison_sociale: string;
  telephone: string;
  telephone_contact: string | null;
  email: string;
  ville: string;
  statut: string;
  statut_campagne: string;
  nom_contact?: string | null;
  decisionnaire_nom?: string | null;
  decisionnaire_fonction?: string | null;
  decisionnaire_email_pro?: string | null;
  max_progpa: number;
  created_at: string;
  updated_at: string;
}

interface AppelFixture {
  id_appel: number;
  id_prospect: number;
  id_agent: number;
  id_campagne: number;
  id_rendez_vous_source?: number | null;
  date_appel: string;
  duree_secondes?: number | null;
  statut_appel: string;
  notes?: string | null;
  abouti: boolean;
  progpa_atteint: number;
  created_at: string;
  updated_at: string;
}

interface CreateAppelPayload {
  id_prospect: number;
  id_campagne: number;
  statut_appel?: string;
  notes?: string;
  origine_appel?: 'auto' | 'manuel' | 'rappel';
  id_rendez_vous_source?: number;
  progpa_atteint?: number;
}

interface CreateLeadPayload {
  id_prospect: number;
  id_campagne: number;
  id_appel?: number;
  date_rdv: string;
  heure_rdv: string;
  motif?: string;
  notes?: string;
  interlocuteur_nom?: string;
  interlocuteur_role?: string;
  telephone_contact_snapshot?: string;
  email_contact_snapshot?: string;
  entreprise_plus_de_cinq_salaries: boolean;
}

interface LeadFixture {
  id_lead: number;
  id_agent: number;
  id_prospect: number;
  id_campagne: number;
  id_appel?: number | null;
  date_rdv: string;
  heure_rdv: string;
  motif: string | null;
  interlocuteur_nom?: string | null;
  interlocuteur_role?: string | null;
  telephone_contact_snapshot?: string | null;
  email_contact_snapshot?: string | null;
  entreprise_plus_de_cinq_salaries: boolean;
  notes: string | null;
  derniere_note_closing?: string | null;
  statut: 'planifie' | 'effectue' | 'annule' | 'reporte' | 'non_honore';
  created_at: string;
  updated_at: string;
  prospect?: ProspectFixture;
  agent?: {
    id_employe: number;
    nom: string;
    prenom: string | null;
    email?: string | null;
  };
  campagne?: {
    id_campagne: number;
    nom_campagne: string;
    type_campagne?: string | null;
  };
  appelsSource?: Array<{
    id_appel: number;
    statut_appel: string;
  }>;
}

interface StatsFixture {
  date: string;
  appels_total: number;
  appels_aboutis: number;
  ventes: number;
  rdv_pris: number;
  rendez_vous_pris: number;
  taux_conversion: number;
  ventes_jour_montant: number;
  ventes_mois_count: number;
  ventes_mois_montant: number;
  prime: null;
}

interface DialerStatusFixture {
  statut: 'pause' | 'pause_apres_appel';
  raison_pause: null;
  debut_statut: string;
  id_campagne_active: number;
}

function toApiResponse<T>(
  data: T,
  pagination?: ApiResponse<T>['pagination'],
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(pagination ? { pagination } : {}),
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextLeadB2BDate(): string {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 1);
  return formatDateForInput(baseDate);
}

async function bootstrapAuthenticatedSession(page: Page, employe: EmployeFixture): Promise<void> {
  await page.addInitScript((storedUser: EmployeFixture) => {
    window.localStorage.setItem('employe', JSON.stringify(storedUser));
    window.localStorage.setItem('antl_disable_twilio', '1');
    document.cookie = 'session_active=1; path=/';
  }, employe);
}

test('MMA: la prise de rendez-vous client suit le parcours complet jusqu au closing', async ({ page }) => {
  const employe: EmployeFixture = {
    id_employe: 17,
    identifiant: 's.martin',
    nom: 'Martin',
    prenom: 'Sophie',
    email: 's.martin@antl.fr',
    actif: true,
  };

  const campagne: CampaignFixture = {
    id_campagne: 7,
    nom_campagne: 'MMA',
    type_campagne: 'lead_b2b',
    statut: 'active',
    autoriser_mobile: false,
    actif: true,
    date_debut: '2026-07-01',
    date_fin: null,
    is_active_runtime: true,
  };

  const prospect: ProspectFixture = {
    id_prospect: 42,
    civilite: 'Mme',
    type_prospect: 'Entreprise',
    nom: 'Durand',
    prenom: null,
    raison_sociale: 'Durand Conseil',
    telephone: '0555443322',
    telephone_contact: '0555443322',
    email: 'contact@durand.fr',
    ville: 'Bordeaux',
    statut: 'nouveau',
    statut_campagne: 'nouveau',
    nom_contact: 'Accueil Durand',
    decisionnaire_nom: 'Claire Durand',
    decisionnaire_fonction: 'Directrice generale',
    decisionnaire_email_pro: 'claire.durand@durand.fr',
    max_progpa: 0,
    created_at: '2026-07-01T08:00:00.000Z',
    updated_at: '2026-07-01T08:00:00.000Z',
  };

  const stats: StatsFixture = {
    date: '2026-07-02',
    appels_total: 0,
    appels_aboutis: 0,
    ventes: 0,
    rdv_pris: 0,
    rendez_vous_pris: 0,
    taux_conversion: 0,
    ventes_jour_montant: 0,
    ventes_mois_count: 0,
    ventes_mois_montant: 0,
    prime: null,
  };

  let dialerStatus: DialerStatusFixture = {
    statut: 'pause',
    raison_pause: null,
    debut_statut: '2026-07-02T09:00:00.000Z',
    id_campagne_active: campagne.id_campagne,
  };

  let nextRendezVousId = 500;
  let nextAppelId = 900;
  let prospectFetchCount = 0;
  let campaignFetchCount = 0;
  let lastProspectFetchAt = 0;
  let lastCampaignFetchAt = 0;

  const createdRendezVousPayloads: CreateLeadPayload[] = [];
  const createdAppelPayloads: CreateAppelPayload[] = [];
  const patchedStatuts: Array<{ statut: string }> = [];
  const unhandledApiRequests: string[] = [];

  const rendezVousState: LeadFixture[] = [];

  const buildRendezVousFixture = (payload: CreateLeadPayload): LeadFixture => ({
    id_lead: nextRendezVousId++,
    id_agent: employe.id_employe,
    id_prospect: payload.id_prospect,
    id_campagne: payload.id_campagne,
    id_appel: payload.id_appel ?? null,
    date_rdv: payload.date_rdv,
    heure_rdv: payload.heure_rdv,
    motif: payload.motif ?? 'Prise de rendez-vous client',
    interlocuteur_nom: payload.interlocuteur_nom ?? null,
    interlocuteur_role: payload.interlocuteur_role ?? null,
    telephone_contact_snapshot: payload.telephone_contact_snapshot ?? null,
    email_contact_snapshot: payload.email_contact_snapshot ?? null,
    entreprise_plus_de_cinq_salaries: payload.entreprise_plus_de_cinq_salaries,
    notes: payload.notes ?? null,
    derniere_note_closing: null,
    statut: 'planifie',
    created_at: '2026-07-02T09:30:00.000Z',
    updated_at: '2026-07-02T09:30:00.000Z',
    prospect,
    agent: {
      id_employe: employe.id_employe,
      nom: employe.nom,
      prenom: employe.prenom,
      email: employe.email,
    },
    campagne: {
      id_campagne: campagne.id_campagne,
      nom_campagne: campagne.nom_campagne,
      type_campagne: campagne.type_campagne,
    },
    appelsSource: [],
  });

  const currentProspectRendezVous = (): LeadFixture[] =>
    rendezVousState.filter(
      (rdv) =>
        rdv.id_prospect === prospect.id_prospect &&
        rdv.id_campagne === campagne.id_campagne,
    );

  await bootstrapAuthenticatedSession(page, employe);

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const apiPath = url.pathname.startsWith('/api') ? url.pathname.slice(4) : url.pathname;
    const requestKey = `${request.method()} ${apiPath}${url.search}`;

    if (request.method() === 'GET' && apiPath === '/csrf-token') {
      await fulfillJson(route, {
        success: true,
        csrfToken: 'playwright-csrf-token',
        headerName: 'x-csrf-token',
      });
      return;
    }

    if (request.method() === 'GET' && apiPath === '/auth/me') {
      await fulfillJson(route, toApiResponse(employe));
      return;
    }

    if (request.method() === 'GET' && apiPath === '/agents/me/statut') {
      await fulfillJson(route, toApiResponse(dialerStatus));
      return;
    }

    if (request.method() === 'PATCH' && apiPath === '/agents/me/statut') {
      const body = request.postDataJSON() as { statut: 'pause' | 'pause_apres_appel' };
      dialerStatus = {
        ...dialerStatus,
        statut: body.statut,
      };
      patchedStatuts.push({ statut: body.statut });
      await fulfillJson(route, toApiResponse(dialerStatus));
      return;
    }

    if (request.method() === 'POST' && apiPath === '/agents/me/heartbeat') {
      await fulfillJson(route, toApiResponse({ ok: true }));
      return;
    }

    if (request.method() === 'GET' && apiPath === '/agents/me/campagnes') {
      await fulfillJson(route, toApiResponse([campagne]));
      return;
    }

    if (request.method() === 'PATCH' && apiPath === '/agents/me/campagne-active') {
      await fulfillJson(route, toApiResponse(dialerStatus));
      return;
    }

    if (request.method() === 'GET' && apiPath === '/twilio/token') {
      await fulfillJson(route, toApiResponse({
        accessToken: 'playwright-local-token',
        identity: employe.identifiant,
        expiresIn: 3600,
      }));
      return;
    }

    if (request.method() === 'GET' && apiPath === `/prospects/${prospect.id_prospect}`) {
      prospectFetchCount += 1;
      lastProspectFetchAt = Date.now();
      await fulfillJson(route, toApiResponse(prospect));
      return;
    }

    if (request.method() === 'GET' && apiPath === `/campagnes/${campagne.id_campagne}`) {
      campaignFetchCount += 1;
      lastCampaignFetchAt = Date.now();
      await fulfillJson(route, toApiResponse(campagne));
      return;
    }

    if (
      request.method() === 'GET' &&
      apiPath === '/produits' &&
      url.searchParams.get('grouped') === 'true' &&
      url.searchParams.get('campagne') === String(campagne.id_campagne)
    ) {
      await fulfillJson(route, toApiResponse({ categories: [] }));
      return;
    }

    if (
      request.method() === 'GET' &&
      apiPath === `/campagnes/${campagne.id_campagne}/paniers`
    ) {
      await fulfillJson(route, toApiResponse([]));
      return;
    }

    if (
      request.method() === 'GET' &&
      apiPath === `/prospects/${prospect.id_prospect}/appels`
    ) {
      const appels: AppelFixture[] = [];
      await fulfillJson(
        route,
        toApiResponse(appels, {
          page: 1,
          limit: 20,
          total: appels.length,
          totalPages: 1,
        }),
      );
      return;
    }

    if (
      request.method() === 'GET' &&
      apiPath === `/leads/prospect/${prospect.id_prospect}`
    ) {
      await fulfillJson(route, toApiResponse(currentProspectRendezVous()));
      return;
    }

    if (
      request.method() === 'GET'
      && apiPath === '/leads/availability'
      && url.searchParams.get('campagne') === String(campagne.id_campagne)
    ) {
      await fulfillJson(route, toApiResponse([]));
      return;
    }

    if (
      request.method() === 'GET' &&
      apiPath === `/rendez-vous/agent/${employe.id_employe}`
    ) {
      await fulfillJson(route, toApiResponse([]));
      return;
    }

    if (
      request.method() === 'GET' &&
      apiPath === `/rendez-vous/prospect/${prospect.id_prospect}`
    ) {
      await fulfillJson(route, toApiResponse([]));
      return;
    }

    if (request.method() === 'POST' && apiPath === '/leads') {
      const payload = request.postDataJSON() as CreateLeadPayload;
      createdRendezVousPayloads.push(payload);
      const createdRendezVous = buildRendezVousFixture(payload);
      rendezVousState.push(createdRendezVous);
      await fulfillJson(route, toApiResponse(createdRendezVous), 201);
      return;
    }

    if (request.method() === 'POST' && apiPath === '/appels') {
      const payload = request.postDataJSON() as CreateAppelPayload;
      createdAppelPayloads.push(payload);

      const createdAppel: AppelFixture = {
        id_appel: nextAppelId++,
        id_prospect: payload.id_prospect,
        id_agent: employe.id_employe,
        id_campagne: payload.id_campagne,
        id_rendez_vous_source: payload.id_rendez_vous_source ?? null,
        date_appel: '2026-07-02T09:45:00.000Z',
        duree_secondes: null,
        statut_appel: payload.statut_appel ?? 'abouti',
        notes: payload.notes ?? null,
        abouti: payload.statut_appel !== 'non_abouti',
        progpa_atteint: payload.progpa_atteint ?? 0,
        created_at: '2026-07-02T09:45:00.000Z',
        updated_at: '2026-07-02T09:45:00.000Z',
      };

      const linkedRendezVous = currentProspectRendezVous()
        .filter((rdv) => rdv.statut === 'planifie' || rdv.statut === 'reporte')
        .at(-1);

      if (linkedRendezVous) {
        linkedRendezVous.derniere_note_closing = payload.notes ?? null;
        linkedRendezVous.appelsSource = [
          {
            id_appel: createdAppel.id_appel,
            statut_appel: createdAppel.statut_appel,
          },
        ];
      }

      await fulfillJson(route, toApiResponse(createdAppel), 201);
      return;
    }

    if (
      request.method() === 'GET' &&
      apiPath === '/rendez-vous/today' &&
      url.searchParams.get('agent') === String(employe.id_employe)
    ) {
      await fulfillJson(route, toApiResponse([]));
      return;
    }

    if (request.method() === 'GET' && apiPath === '/employes/me/stats') {
      await fulfillJson(route, toApiResponse(stats));
      return;
    }

    if (request.method() === 'GET' && apiPath === '/notifications/me') {
      await fulfillJson(route, toApiResponse([]));
      return;
    }

    unhandledApiRequests.push(requestKey);
    await fulfillJson(route, {
      success: false,
      message: `Unhandled API request: ${requestKey}`,
    }, 500);
  });

  const nextLeadDate = getNextLeadB2BDate();

  await page.goto(`/prospect/${prospect.id_prospect}`);

  await expect(page.getByRole('heading', { name: prospect.raison_sociale })).toBeVisible();
  await expect(page.getByText('TEST')).toBeVisible();
  await expect.poll(() => prospectFetchCount).toBeGreaterThanOrEqual(2);
  await expect.poll(() => campaignFetchCount).toBeGreaterThanOrEqual(1);
  await expect
    .poll(() => Date.now() - Math.max(lastProspectFetchAt, lastCampaignFetchAt), {
      timeout: 5000,
    })
    .toBeGreaterThan(800);

  await expect(page.getByRole('button', { name: 'Prise de rendez-vous client' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Historique rendez-vous' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Agenda personnel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tarifs' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Agrément' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Prise de rendez-vous client' }).click();
  await expect(page.getByRole('heading', { name: 'Prise de rendez-vous client' })).toBeVisible();

  await page.locator('#dateRdv').fill(nextLeadDate);
  await page.getByPlaceholder('HH').fill('10');
  await page.getByPlaceholder('MM').fill('30');
  await page.locator('#interlocuteurNom').fill('Claire Durand');
  await page.locator('#interlocuteurRole').fill('Directrice generale');
  await page.locator('#telephone').fill('0611223344');
  await page.locator('#email').fill('claire.durand@durand.fr');
  await page.getByLabel('Entreprise avec plus de 5 salariés').check();
  await page.locator('#notes').fill('Qualification MMA confirmee avec besoin de rappel de synthese.');
  await expect(page.locator('#dateRdv')).toHaveValue(nextLeadDate);
  await expect(page.getByPlaceholder('HH')).toHaveValue('10');
  await expect(page.getByPlaceholder('MM')).toHaveValue('30');
  await expect(page.locator('#telephone')).toHaveValue('0611223344');
  await expect(page.locator('#notes')).toHaveValue('Qualification MMA confirmee avec besoin de rappel de synthese.');
  const [createRendezVousResponse] = await Promise.all([
    page.waitForResponse((response) => {
      return response.request().method() === 'POST' && response.url().includes('/api/leads');
    }),
    page.getByRole('button', { name: 'Valider la mise en relation' }).click(),
  ]);

  expect(createRendezVousResponse.ok()).toBeTruthy();
  expect(createRendezVousResponse.status()).toBe(201);

  const recapModal = page.locator('.rdv-recap-modal');

  await expect(recapModal.getByRole('heading', { name: 'Recapitulatif du rendez-vous client' })).toBeVisible();
  await expect(recapModal.getByRole('definition').filter({ hasText: 'Claire Durand' })).toBeVisible();
  await expect(recapModal.getByRole('definition').filter({ hasText: 'Directrice generale' })).toBeVisible();
  await expect(recapModal.getByRole('definition').filter({ hasText: '0611223344' })).toBeVisible();
  await expect(recapModal.getByRole('definition').filter({ hasText: 'claire.durand@durand.fr' })).toBeVisible();

  await page.getByRole('button', { name: 'Fermer et passer au closing' }).click();

  const closingModal = page.locator('.closing-modal').first();

  await expect(closingModal.getByRole('heading', { name: "Résultat de l'appel", level: 2 })).toBeVisible();
  await expect(closingModal.getByRole('button', { name: /Rendez-vous validé !/ })).toBeVisible();
  await expect(closingModal.getByRole('button', { name: /Relance/ })).toBeVisible();
  await expect(closingModal.getByRole('button', { name: /Vente conclue/ })).toHaveCount(0);
  await expect(closingModal.getByRole('button', { name: /Commande à établir/ })).toHaveCount(0);
  await expect(closingModal.getByRole('button', { name: /Rendez-vous pris/ })).toHaveCount(1);

  await closingModal.getByRole('button', { name: /Rendez-vous validé !/ }).click();
  await closingModal.locator('.closing-modal__textarea').fill('Rendez-vous confirme avec decisionnaire disponible.');

  const submitButton = closingModal.getByRole('button', { name: 'Valider et continuer' });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Recherche manuelle')).toBeVisible();

  expect(unhandledApiRequests).toEqual([]);
  expect(createdRendezVousPayloads).toHaveLength(1);
  expect(createdRendezVousPayloads[0]).toEqual({
    id_prospect: prospect.id_prospect,
    id_campagne: campagne.id_campagne,
    date_rdv: nextLeadDate,
    heure_rdv: '10:30:00',
    motif: 'Prise de rendez-vous client',
    interlocuteur_nom: 'Claire Durand',
    interlocuteur_role: 'Directrice generale',
    telephone_contact_snapshot: '0611223344',
    email_contact_snapshot: 'claire.durand@durand.fr',
    entreprise_plus_de_cinq_salaries: true,
    notes: 'Qualification MMA confirmee avec besoin de rappel de synthese.',
  });

  expect(createdAppelPayloads).toHaveLength(1);
  expect(createdAppelPayloads[0]).toMatchObject({
    id_prospect: prospect.id_prospect,
    id_campagne: campagne.id_campagne,
    statut_appel: 'rendez_vous_pris',
    notes: 'Rendez-vous confirme avec decisionnaire disponible.',
    origine_appel: 'manuel',
    progpa_atteint: 5,
  });
  expect(createdAppelPayloads[0].id_rendez_vous_source).toBeUndefined();

  expect(patchedStatuts).toContainEqual({ statut: 'pause_apres_appel' });
});
