import { test, expect } from '@playwright/test';
import { login } from './fixtures/base';
import { testProspect, testIds } from './fixtures/test-data';

test.describe('Closing Modal', () => {
  // Helper pour creer les donnees de closing
  const createPendingClosingData = (dureeAppel?: number) => ({
    prospectId: testProspect.id,
    prospectName: testProspect.fullName,
    campagneId: testIds.campagneId,
    dureeAppel: dureeAppel,
    timestamp: Date.now(),
  });

  test('modale ne s\'affiche pas sans pending closing', async ({ page }) => {
    await login(page);

    // Verifie que la modale n'est pas visible
    await expect(page.locator('.closing-modal')).not.toBeVisible();
  });

  test('modale s\'affiche avec pending closing', async ({ page }) => {
    // Pre-configure le localStorage avant login
    await page.goto('/login');
    await page.evaluate((data) => {
      localStorage.setItem('antl_pending_closing', JSON.stringify(data));
    }, createPendingClosingData(120));

    await login(page);

    // Attend que la modale apparaisse
    await expect(page.locator('.closing-modal')).toBeVisible({ timeout: 5000 });
  });

  test('modale affiche le nom du prospect', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate((data) => {
      localStorage.setItem('antl_pending_closing', JSON.stringify(data));
    }, createPendingClosingData());

    await login(page);

    await expect(page.locator('.closing-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`.closing-modal >> text=${testProspect.fullName}`)).toBeVisible();
  });

  test('modale affiche la duree d\'appel si fournie', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate((data) => {
      localStorage.setItem('antl_pending_closing', JSON.stringify(data));
    }, createPendingClosingData(125)); // 2min05

    await login(page);

    await expect(page.locator('.closing-modal')).toBeVisible({ timeout: 5000 });
    // Verifie que la duree est affichee (format: 2:05 ou 02:05)
    await expect(page.locator('.closing-modal__duration')).toBeVisible();
  });

  test('modale affiche les options de statut', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate((data) => {
      localStorage.setItem('antl_pending_closing', JSON.stringify(data));
    }, createPendingClosingData());

    await login(page);

    await expect(page.locator('.closing-modal')).toBeVisible({ timeout: 5000 });

    // Verifie les options de statut
    await expect(page.locator('text=Vente conclue')).toBeVisible();
    await expect(page.locator('text=Rendez-vous pris')).toBeVisible();
  });

  test('bouton Valider visible dans modale', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate((data) => {
      localStorage.setItem('antl_pending_closing', JSON.stringify(data));
    }, createPendingClosingData());

    await login(page);

    await expect(page.locator('.closing-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.closing-modal button:has-text("Valider")')).toBeVisible();
  });

  test('bouton Valider desactive sans selection de statut', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate((data) => {
      localStorage.setItem('antl_pending_closing', JSON.stringify(data));
    }, createPendingClosingData());

    await login(page);

    await expect(page.locator('.closing-modal')).toBeVisible({ timeout: 5000 });

    // Le bouton Valider doit etre desactive sans selection
    const validerBtn = page.locator('.closing-modal button:has-text("Valider")');
    await expect(validerBtn).toBeDisabled();
  });

  test('selection d\'un statut active le bouton Valider', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate((data) => {
      localStorage.setItem('antl_pending_closing', JSON.stringify(data));
    }, createPendingClosingData());

    await login(page);

    await expect(page.locator('.closing-modal')).toBeVisible({ timeout: 5000 });

    // Clique sur un statut
    await page.click('.closing-modal >> text=Vente conclue');

    // Le bouton Valider ne doit plus etre disabled
    const validerBtn = page.locator('.closing-modal button:has-text("Valider")');
    await expect(validerBtn).not.toBeDisabled();
  });

  test('modale affiche message obligatoire', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate((data) => {
      localStorage.setItem('antl_pending_closing', JSON.stringify(data));
    }, createPendingClosingData());

    await login(page);

    await expect(page.locator('.closing-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Cette etape est obligatoire')).toBeVisible();
  });

  test('champ notes visible dans modale', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate((data) => {
      localStorage.setItem('antl_pending_closing', JSON.stringify(data));
    }, createPendingClosingData());

    await login(page);

    await expect(page.locator('.closing-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.closing-modal textarea')).toBeVisible();
  });
});
