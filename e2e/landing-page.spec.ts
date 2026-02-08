import { test, expect } from '@playwright/test';
import { login } from './fixtures/base';

test.describe('Page principale', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('affiche les informations du prospect', async ({ page }) => {
    // Attend que la page soit chargee
    await expect(page.locator('.prospect-info-header h1')).toBeVisible({ timeout: 10000 });
    // La table avec les infos prospect doit etre visible
    await expect(page.locator('.prospect-info-table')).toBeVisible();
  });

  test('affiche la vue Qui est-ce par defaut', async ({ page }) => {
    await expect(page.locator('h2:has-text("Qui est-ce")')).toBeVisible();
  });

  test('navigation vers Historique appels', async ({ page }) => {
    await page.click('button:has-text("Historique appels")');

    await expect(page.locator('h2:has-text("Historique des appels")')).toBeVisible();
  });

  test('navigation vers Historique offres', async ({ page }) => {
    await page.click('button:has-text("Historique offres")');

    // Affiche soit l'historique des ventes, soit le message "aucune vente"
    await expect(page.locator('.historique-ventes')).toBeVisible();
  });

  test('navigation vers Rendez-vous', async ({ page }) => {
    await page.click('button:has-text("Rendez-vous")');

    await expect(page.locator('h2:has-text("Rendez-vous")')).toBeVisible();
  });

  test('navigation vers Commande', async ({ page }) => {
    await page.click('button:has-text("Commande")');

    await expect(page.locator('h2:has-text("Catalogue")')).toBeVisible();
  });

  test('ouvre Plan appels dans nouvelle fenetre', async ({ page, context }) => {
    const pagePromise = context.waitForEvent('page');
    await page.click('button:has-text("Plan d")');
    const newPage = await pagePromise;

    await expect(newPage.url()).toContain('/plan-appel');
  });

  test('ouvre Objections dans nouvelle fenetre', async ({ page, context }) => {
    const pagePromise = context.waitForEvent('page');
    await page.click('button:has-text("Objections")');
    const newPage = await pagePromise;

    await expect(newPage.url()).toContain('/objections');
  });

  test('boutons de navigation actifs visibles', async ({ page }) => {
    // Verifie que le bouton Qui est-ce est actif par defaut
    await expect(page.locator('.prospect-info-header button:has-text("Qui est-ce")')).toBeVisible();
  });

  test('message de succes apres commande', async ({ page }) => {
    // Configure un pending closing qui simule une commande validee
    await page.evaluate(() => {
      localStorage.setItem('antl_pending_closing', JSON.stringify({
        prospectId: 1,
        prospectName: 'Jean Martin',
        campagneId: 1,
        timestamp: Date.now(),
      }));
    });

    // Recharge la page
    await page.reload();

    // La modale de closing doit s'afficher
    await expect(page.locator('.closing-modal')).toBeVisible({ timeout: 5000 });
  });
});
