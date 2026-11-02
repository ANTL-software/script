import { expect, test } from '@playwright/test';

for (const source of ['scrap_prospection_web--ND nov26', 'autre']) {
  test(`fiche Qui est-ce : encart web et corrections (${source})`, async ({ page }) => {
    await page.route('**/api/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) }));
    await page.goto('/');
    await page.evaluate(async (source) => {
      const [{ default: React }, { default: ReactDOM }, { ProspectContext }, { CampaignContext }, { ToastContext }, { default: QuiEstCe }] = await Promise.all([
        import('/@id/react'), import('/@id/react-dom/client'),
        import('/src/context/prospectContext/ProspectContext.tsx'), import('/src/context/campaignContext/CampaignContext.tsx'),
        import('/src/context/toastContext/ToastContext.tsx'), import('/src/views/components/quiEstCe/QuiEstCe.tsx'),
      ]);
      const initial = { id_prospect: 1, type_prospect: 'Entreprise', nom: 'Entreprise exemple', telephone: '0102030405', statut: 'nouveau', effectif_min: 4, effectif_max: 10, max_progpa: 0, source, site_web: 'https://entreprise.fr/', enrichissement_payload: { scrap_prospection_web_nd_nov26: { sites: [{ agence: 'Incomm' }] } }, created_at: '2026-11-02', updated_at: '2026-11-02' };
      function Harness() {
        const [prospect, setProspect] = React.useState(initial);
        const [updates, setUpdates] = React.useState([]);
        const updateProspect = async (patch) => {
          setUpdates(previous => [...previous, patch]);
          setProspect(previous => ({ ...previous, ...patch, enrichissement_payload: { scrap_prospection_web_nd_nov26: { ...previous.enrichissement_payload.scrap_prospection_web_nd_nov26, ...('agence_site_web' in patch ? { agence: patch.agence_site_web || null } : {}) } } }));
        };
        return React.createElement(ProspectContext.Provider, { value: { currentProspect: prospect, isLoading: false, updateProspect } },
          React.createElement(CampaignContext.Provider, { value: { currentCampaign: { id_campagne: 7 } } },
            React.createElement(ToastContext.Provider, { value: { showToast: () => {} } }, React.createElement(QuiEstCe), React.createElement('output', { id: 'patches' }, JSON.stringify(updates)))));
      }
      document.querySelector('#root')?.remove();
      const mount = document.createElement('div'); mount.style.cssText = 'max-width:1000px;margin:24px auto;padding:24px;background:white'; document.body.append(mount);
      ReactDOM.createRoot(mount).render(React.createElement(Harness));
    }, source);
    const card = page.getByRole('region', { name: 'Prospection web — novembre 2026' });
    const confirm = page.getByRole('button', { name: 'Confirmer l’effectif actuel' });
    await expect(confirm).toHaveClass(/btn-secondary/);
    await confirm.click();
    await expect(page.locator('#patches')).toContainText('"effectif_confirmation":true');
    if (source === 'autre') {
      await expect(card).toHaveCount(0);
      return;
    }
    await expect(card.getByRole('link')).toHaveAttribute('href', 'https://entreprise.fr/');
    await expect(card.getByRole('link')).toHaveAttribute('target', '_blank');
    await expect(card).toContainText('Incomm');
    await page.getByRole('button', { name: 'Modifier', exact: true }).click();
    await page.getByLabel('Agence indiquée').fill('Agence corrigée');
    await page.getByRole('button', { name: 'Annuler', exact: true }).click();
    await expect(card).toContainText('Incomm');
    await page.getByRole('button', { name: 'Modifier', exact: true }).click();
    await page.getByLabel('Site web', { exact: true }).fill('javascript:alert(1)');
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    await expect(card).toContainText('Saisissez une URL');
    await page.getByLabel('Site web', { exact: true }).fill('https://corrige.fr/');
    await page.getByLabel('Agence indiquée').fill('Agence corrigée');
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    await expect(card.getByRole('link')).toHaveAttribute('href', 'https://corrige.fr/');
    await expect(card).toContainText('Agence corrigée');
    await expect(page.locator('#patches')).toContainText('"agence_site_web":"Agence corrigée"');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(card).toBeVisible();
    expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.getByRole('button', { name: 'Modifier', exact: true }).click();
    await page.getByLabel('Site web', { exact: true }).fill('');
    await page.getByLabel('Agence indiquée').fill('');
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    await expect(card).toContainText('Non renseignée');
    await expect(card.getByRole('link')).toHaveCount(0);
    await page.getByRole('button', { name: 'Modifier', exact: true }).click();
    await expect(page.getByLabel('Agence indiquée')).toHaveValue('');
  });
}
