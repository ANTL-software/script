import { expect, test } from '@playwright/test';

test('un agenda Script ouvert reprend puis rend un rendez-vous transféré sans rechargement', async ({ page }) => {
  let owner = 8;
  let failSync = false;
  let mutations = 0;
  const rdv = () => ({ id_rendez_vous: 31, id_prospect: 15, id_campagne: 7, id_agent: owner, date_rdv: '2030-10-29', heure_rdv: '14:00:00', statut: 'planifie', motif: 'Relance devis', derniere_note_closing: 'Note conservée de Alice', prospect: { id_prospect: 15, nom: 'Exemple', prenom: 'Client' }, appelsSource: [{ id_appel: 42, statut_appel: 'rdv_pris' }] });
  await page.addInitScript(() => localStorage.setItem('antl_disable_twilio', '1'));
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'PUT') { mutations++; await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Rendez-vous transféré' }) }); return; }
    if (failSync && path.includes('/rendez-vous/')) { await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Synchronisation indisponible' }) }); return; }
    const data = path.endsWith('/rendez-vous/agent/9') ? (owner === 9 ? [rdv()] : []) : path.endsWith('/rendez-vous/prospect/15') ? [rdv()] : [];
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(path.endsWith('/csrf-token') ? { success: true, csrfToken: 'fixture', headerName: 'x-csrf-token' } : { success: true, data }) });
  });
  await page.goto('/');
  await page.clock.install();
  await page.evaluate(async () => {
    const [{ default: React }, { default: ReactDOM }, { UserContext }, { CampaignContext }, { ToastContext }, { useAgentCalendar }] = await Promise.all([
      import('/node_modules/.vite/deps/react.js'), import('/node_modules/.vite/deps/react-dom_client.js'),
      import('/src/context/userContext/UserContext.tsx'),
      import('/src/context/campaignContext/CampaignContext.tsx'),
      import('/src/context/toastContext/ToastContext.tsx'),
      import('/src/hooks/useAgentCalendar.ts'),
    ]);
    const { createElement } = React;
    const { createRoot } = ReactDOM;
    const noop = async () => {};
    function Probe() {
      const state = useAgentCalendar(15, 7);
      return createElement('div', null, createElement('button', { id: 'attempt-update', onClick: () => void state.updateRendezVous(31, new Date('2030-10-29T14:00:00'), 'planifie') }, 'Modifier'), createElement('output', { id: 'portfolio-calendar' }, JSON.stringify({ syncError: state.syncError, lastSyncedAt: state.lastSyncedAt, mine: state.myProspectRdvs.length, others: state.otherAgentRdvList.length, owner: state.myProspectRdvs[0]?.id_agent, note: state.myProspectRdvs[0]?.derniere_note_closing })));
    }
    const mount = document.createElement('div'); document.body.append(mount);
    createRoot(mount).render(createElement(UserContext.Provider, { value: { user: { id_employe: 9, nom: 'Nouveau', prenom: 'Nina' }, isAuthenticated: true, isLoading: false, error: null, login: noop, logout: noop, refreshUser: noop, clearError: () => {} } },
      createElement(CampaignContext.Provider, { value: { currentCampaign: { id_campagne: 7 }, isLoading: false, error: null, produits: [], categories: [], categoriesTree: [], produitsLoading: false, produitsError: null, paniers: [], paniersLoading: false, paniersError: null, loadCampaign: noop, loadProduits: noop, loadProduitsGrouped: noop, loadPaniers: noop, searchProduits: () => [], clearCampaign: () => {}, clearError: () => {}, clearProduitsError: () => {}, clearPaniersError: () => {} } },
        createElement(ToastContext.Provider, { value: { toasts: [], showToast: () => {}, removeToast: () => {}, confirm: async () => true } }, createElement(Probe)))));
  });
  await expect(page.locator('#portfolio-calendar')).toContainText('"mine":0,"others":1');
  owner = 9;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('#portfolio-calendar')).toContainText('"mine":1,"others":0,"owner":9');
  await expect(page.locator('#portfolio-calendar')).toContainText('Note conservée de Alice');
  failSync = true;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('#portfolio-calendar')).toContainText('Synchronisation indisponible');
  await expect(page.locator('#portfolio-calendar')).toContainText('"mine":1');
  await page.locator('#attempt-update').click();
  await expect.poll(() => mutations).toBe(1);
  await expect(page.locator('#portfolio-calendar')).toContainText('"mine":1');
  failSync = false;
  owner = 8;
  await page.clock.runFor(30_100);
  await expect(page.locator('#portfolio-calendar')).toContainText('"mine":0,"others":1');
});
