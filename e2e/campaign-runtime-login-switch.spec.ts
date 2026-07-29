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
  type_campagne: 'vente' | 'lead_b2b';
  statut: 'active';
  autoriser_mobile: boolean;
  actif: boolean;
  date_debut: string;
  date_fin: string | null;
  logo_path: string;
  is_active_runtime?: boolean;
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
  id_campagne: number;
  max_progpa: number;
  created_at: string;
  updated_at: string;
}

interface DialerStatusFixture {
  statut: 'pause';
  raison_pause: null;
  debut_statut: string;
  id_campagne_active: number;
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

interface RuntimeScenarioState {
  activeCampaignId: number;
  statsCampaigns: number[];
  rendezVousTodayCampaigns: number[];
  campaignDetails: number[];
  prospectDetails: Array<{
    prospectId: number;
    campagneId: number | null;
  }>;
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function bootstrapLocalSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('antl_disable_twilio', '1');
  });
}

async function login(page: Page, identifiant: string, password: string): Promise<void> {
  await page.getByLabel('Identifiant').fill(identifiant);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
}

async function expectCampaignLogo(page: Page, campaignName: string, logoFragment: string): Promise<void> {
  const logo = page.locator('img.logo-campaign');
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute('alt', campaignName);
  await expect(logo).toHaveAttribute('src', new RegExp(escapeRegExp(logoFragment)));
}

async function openProspectFromManualSearch(page: Page, phone: string): Promise<void> {
  await page.getByPlaceholder('Numéro de téléphone du prospect...').fill(phone);
  await page.getByRole('button', { name: 'Rechercher' }).click();
}

test('le script se recale proprement sur la campagne runtime apres reconnexion et ne conserve pas le contexte precedent', async ({ page, context }) => {
  const employe: EmployeFixture = {
    id_employe: 12,
    identifiant: 'marti001',
    nom: 'Martin',
    prenom: 'Nina',
    email: 'n.martin@antl.fr',
    actif: true,
  };

  const campagnes = new Map<number, CampaignFixture>([
    [7, {
      id_campagne: 7,
      nom_campagne: 'Les Cigales',
      type_campagne: 'vente',
      statut: 'active',
      autoriser_mobile: false,
      actif: true,
      date_debut: '2026-07-01',
      date_fin: null,
      logo_path: '/uploads/campagne_logos/les-cigales.png',
    }],
    [9, {
      id_campagne: 9,
      nom_campagne: 'MMA Planete Assurance',
      type_campagne: 'lead_b2b',
      statut: 'active',
      autoriser_mobile: false,
      actif: true,
      date_debut: '2026-07-01',
      date_fin: null,
      logo_path: '/uploads/campagne_logos/mma-planete-assurance.png',
    }],
  ]);

  const prospectsByPhone = new Map<string, ProspectFixture>([
    ['0102030405', {
      id_prospect: 101,
      civilite: 'M.',
      type_prospect: 'Entreprise',
      nom: 'Cigales',
      prenom: null,
      raison_sociale: 'Boulangerie des Cigales',
      telephone: '0102030405',
      telephone_contact: '0102030406',
      email: 'contact@cigales.fr',
      ville: 'Lyon',
      statut: 'nouveau',
      statut_campagne: 'nouveau',
      id_campagne: 7,
      max_progpa: 0,
      created_at: '2026-07-01T08:00:00.000Z',
      updated_at: '2026-07-01T08:00:00.000Z',
    }],
    ['0203040506', {
      id_prospect: 202,
      civilite: 'Mme',
      type_prospect: 'Entreprise',
      nom: 'Planete',
      prenom: null,
      raison_sociale: 'Planete Travaux',
      telephone: '0203040506',
      telephone_contact: '0203040507',
      email: 'contact@planete-travaux.fr',
      ville: 'Nantes',
      statut: 'nouveau',
      statut_campagne: 'nouveau',
      id_campagne: 9,
      max_progpa: 0,
      created_at: '2026-07-01T08:00:00.000Z',
      updated_at: '2026-07-01T08:00:00.000Z',
    }],
  ]);

  const prospectsById = new Map<number, ProspectFixture>(
    Array.from(prospectsByPhone.values()).map((prospect) => [prospect.id_prospect, prospect]),
  );

  const scenarioState: RuntimeScenarioState = {
    activeCampaignId: 7,
    statsCampaigns: [],
    rendezVousTodayCampaigns: [],
    campaignDetails: [],
    prospectDetails: [],
  };

  await bootstrapLocalSession(page);

  await context.route('**/uploads/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" fill="#ffffff"/></svg>',
    });
  });

  await context.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const method = request.method();

    const activeCampaign = campagnes.get(scenarioState.activeCampaignId);
    if (!activeCampaign) {
      throw new Error(`Campagne active inconnue: ${scenarioState.activeCampaignId}`);
    }

    if (pathname.endsWith('/api/csrf-token') && method === 'GET') {
      await fulfillJson(route, {
        success: true,
        csrfToken: 'playwright-csrf-token',
        headerName: 'x-csrf-token',
      });
      return;
    }

    if (pathname.endsWith('/api/auth/login') && method === 'POST') {
      await fulfillJson(route, toApiResponse({ employe }));
      return;
    }

    if (pathname.endsWith('/api/auth/me') && method === 'GET') {
      await fulfillJson(route, toApiResponse(employe));
      return;
    }

    if (pathname.endsWith('/api/auth/logout') && method === 'POST') {
      await fulfillJson(route, toApiResponse({}));
      return;
    }

    if (pathname.endsWith('/api/agents/me/statut') && method === 'GET') {
      const status: DialerStatusFixture = {
        statut: 'pause',
        raison_pause: null,
        debut_statut: '2026-07-03T08:00:00.000Z',
        id_campagne_active: scenarioState.activeCampaignId,
      };
      await fulfillJson(route, toApiResponse(status));
      return;
    }

    if (pathname.endsWith('/api/agents/me/campagnes') && method === 'GET') {
      const runtimeCampaigns = Array.from(campagnes.values()).map((campagne) => ({
        ...campagne,
        is_active_runtime: campagne.id_campagne === scenarioState.activeCampaignId,
      }));
      await fulfillJson(route, toApiResponse(runtimeCampaigns));
      return;
    }

    if (pathname.endsWith('/api/agents/me/heartbeat') && method === 'POST') {
      await fulfillJson(route, toApiResponse({}));
      return;
    }

    if (pathname.endsWith('/api/employes/me/stats') && method === 'GET') {
      const campagneId = Number.parseInt(url.searchParams.get('campagne') ?? '0', 10) || 0;
      scenarioState.statsCampaigns.push(campagneId);

      const stats: StatsFixture = {
        date: '2026-07-03',
        appels_total: campagneId === 9 ? 3 : 5,
        appels_aboutis: campagneId === 9 ? 2 : 4,
        ventes: campagneId === 9 ? 0 : 1,
        rdv_pris: campagneId === 9 ? 1 : 0,
        rendez_vous_pris: campagneId === 9 ? 2 : 1,
        taux_conversion: campagneId === 9 ? 33 : 20,
        ventes_jour_montant: campagneId === 9 ? 0 : 149,
        ventes_mois_count: campagneId === 9 ? 0 : 7,
        ventes_mois_montant: campagneId === 9 ? 0 : 1250,
        prime: null,
      };

      await fulfillJson(route, toApiResponse(stats));
      return;
    }

    if (pathname.endsWith('/api/rendez-vous/today') && method === 'GET') {
      const campagneId = Number.parseInt(url.searchParams.get('campagne') ?? '0', 10) || 0;
      scenarioState.rendezVousTodayCampaigns.push(campagneId);
      await fulfillJson(route, toApiResponse([]));
      return;
    }

    if (pathname.endsWith('/api/notifications/me') && method === 'GET') {
      await fulfillJson(route, toApiResponse([]));
      return;
    }

    const campagneDetailsMatch = pathname.match(/\/api\/campagnes\/(\d+)$/);
    if (campagneDetailsMatch && method === 'GET') {
      const campaignId = Number.parseInt(campagneDetailsMatch[1], 10);
      const campaign = campagnes.get(campaignId);
      if (!campaign) {
        await fulfillJson(route, { success: false, message: 'Campagne introuvable' }, 404);
        return;
      }

      scenarioState.campaignDetails.push(campaignId);
      await fulfillJson(route, toApiResponse(campaign));
      return;
    }

    const campagnePaniersMatch = pathname.match(/\/api\/campagnes\/(\d+)\/paniers$/);
    if (campagnePaniersMatch && method === 'GET') {
      await fulfillJson(route, toApiResponse([]));
      return;
    }

    const campagnePlanMatch = pathname.match(/\/api\/campagnes\/(\d+)\/plan-appel$/);
    if (campagnePlanMatch && method === 'GET') {
      const campaignId = Number.parseInt(campagnePlanMatch[1], 10);
      await fulfillJson(route, toApiResponse([
        {
          id_plan: campaignId * 10 + 1,
          id_campagne: campaignId,
          etape: 1,
          titre: 'Accroche',
          contenu: `Plan ${campaignId}`,
          ordre_affichage: 1,
          actif: true,
        },
      ]));
      return;
    }

    const campagneObjectionsMatch = pathname.match(/\/api\/campagnes\/(\d+)\/objections$/);
    if (campagneObjectionsMatch && method === 'GET') {
      const campaignId = Number.parseInt(campagneObjectionsMatch[1], 10);
      await fulfillJson(route, toApiResponse([
        {
          id_objection: campaignId * 10 + 2,
          id_campagne: campaignId,
          categorie: 'Tarif',
          titre: `Objection ${campaignId}`,
          texte_objection: 'Cest trop cher',
          texte_reponse: 'Nous adaptons la solution',
          ordre_affichage: 1,
          actif: true,
        },
      ]));
      return;
    }

    if (pathname.endsWith('/api/produits') && method === 'GET' && url.searchParams.get('grouped') === 'true') {
      await fulfillJson(route, toApiResponse({ categories: [] }));
      return;
    }

    const prospectByPhoneMatch = pathname.match(/\/api\/prospects\/telephone\/(.+)$/);
    if (prospectByPhoneMatch && method === 'GET') {
      const rawPhone = decodeURIComponent(prospectByPhoneMatch[1]);
      const phone = rawPhone.replace(/[\s\-().]/g, '');
      const prospect = prospectsByPhone.get(phone);
      if (!prospect) {
        await fulfillJson(route, { success: false, message: 'Prospect non trouve' }, 404);
        return;
      }

      await fulfillJson(route, toApiResponse(prospect));
      return;
    }

    const prospectByIdMatch = pathname.match(/\/api\/prospects\/(\d+)$/);
    if (prospectByIdMatch && method === 'GET') {
      const prospectId = Number.parseInt(prospectByIdMatch[1], 10);
      const prospect = prospectsById.get(prospectId);
      if (!prospect) {
        await fulfillJson(route, { success: false, message: 'Prospect introuvable' }, 404);
        return;
      }

      const campagneId = Number.parseInt(url.searchParams.get('campagne') ?? '0', 10) || null;
      scenarioState.prospectDetails.push({ prospectId, campagneId });
      await fulfillJson(route, toApiResponse(prospect));
      return;
    }

    const prospectAppelsMatch = pathname.match(/\/api\/prospects\/(\d+)\/appels$/);
    if (prospectAppelsMatch && method === 'GET') {
      await fulfillJson(route, toApiResponse([], {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
      }));
      return;
    }

    const prospectVentesMatch = pathname.match(/\/api\/prospects\/(\d+)\/ventes$/);
    if (prospectVentesMatch && method === 'GET') {
      await fulfillJson(route, toApiResponse([], {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
      }));
      return;
    }

    const rendezVousProspectMatch = pathname.match(/\/api\/rendez-vous\/prospect\/(\d+)$/);
    if (rendezVousProspectMatch && method === 'GET') {
      await fulfillJson(route, toApiResponse([]));
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        message: `Unhandled API route: ${method} ${pathname}`,
      }),
    });
  });

  await page.goto('/login');

  await login(page, employe.identifiant, 'secret123');

  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('header')).toBeVisible();
  await expectCampaignLogo(page, 'Les Cigales', 'les-cigales.png');
  await expect.poll(() => scenarioState.statsCampaigns.includes(7)).toBe(true);
  await expect.poll(() => scenarioState.rendezVousTodayCampaigns.includes(7)).toBe(true);

  await openProspectFromManualSearch(page, '0102030405');
  await expect(page).toHaveURL(/\/prospect\/101\?source=manual$/);
  await expect(page.getByRole('heading', { name: 'Boulangerie des Cigales' })).toBeVisible();
  await expectCampaignLogo(page, 'Les Cigales', 'les-cigales.png');
  await expect(page.getByRole('button', { name: 'Historique offres' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rendez-vous' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Commande' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Prise de rendez-vous client' })).toHaveCount(0);
  await expect.poll(() => scenarioState.prospectDetails.some((request) => request.prospectId === 101 && request.campagneId === 7)).toBe(true);

  await page.getByRole('button', { name: 'Retour' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expectCampaignLogo(page, 'Les Cigales', 'les-cigales.png');

  scenarioState.activeCampaignId = 9;

  await page.getByRole('button', { name: 'Déconnexion' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await login(page, employe.identifiant, 'secret123');

  await expect(page).toHaveURL(/\/$/);
  await expectCampaignLogo(page, 'MMA Planete Assurance', 'mma-planete-assurance.png');
  await expect.poll(() => scenarioState.statsCampaigns.includes(9)).toBe(true);
  await expect.poll(() => scenarioState.rendezVousTodayCampaigns.includes(9)).toBe(true);

  await openProspectFromManualSearch(page, '0203040506');
  await expect(page).toHaveURL(/\/prospect\/202\?source=manual$/);
  await expect(page.getByRole('heading', { name: 'Planete Travaux' })).toBeVisible();
  await expectCampaignLogo(page, 'MMA Planete Assurance', 'mma-planete-assurance.png');
  await expect(page.getByRole('button', { name: 'Historique rendez-vous' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Agenda personnel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Prise de rendez-vous client' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Historique offres' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Commande' })).toHaveCount(0);
  await expect.poll(() => scenarioState.prospectDetails.some((request) => request.prospectId === 202 && request.campagneId === 9)).toBe(true);

  // Le marqueur lisible peut être absent dans une nouvelle fenêtre
  // (localhost/127.0.0.1, domaine de cookie ou environnement test). Le cookie
  // httpOnly reste la source d'autorité et `/auth/me` doit suffire à restaurer
  // la session de la popup à partir du profil partagé en localStorage.
  await context.clearCookies({ name: 'session_active' });

  const planAppelPopupPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: "Plan d'appels" }).click();
  const planAppelPopup = await planAppelPopupPromise;
  await expect(planAppelPopup).toHaveURL(/\/plan-appel\?campagne=9$/);
  await expect(
    planAppelPopup.getByRole('heading', { name: "Plan d'appel", exact: true }),
  ).toBeVisible();
  await expect(planAppelPopup.getByText('MMA Planete Assurance')).toBeVisible();
  await expect(planAppelPopup).not.toHaveURL(/\/login/);
  await planAppelPopup.close();

  const objectionsPopupPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Objections' }).click();
  const objectionsPopup = await objectionsPopupPromise;
  await expect(objectionsPopup).toHaveURL(/\/objections\?campagne=9$/);
  await expect(
    objectionsPopup.getByRole('heading', { name: 'Objections', exact: true }),
  ).toBeVisible();
  await expect(objectionsPopup.getByText('MMA Planete Assurance')).toBeVisible();
  await expect(objectionsPopup).not.toHaveURL(/\/login/);
  await objectionsPopup.close();

  await page.goto('/');
  await expectCampaignLogo(page, 'MMA Planete Assurance', 'mma-planete-assurance.png');
  await expect.poll(() => scenarioState.campaignDetails.includes(7)).toBe(true);
  await expect.poll(() => scenarioState.campaignDetails.includes(9)).toBe(true);
});
