import { test, expect } from '@playwright/test';
import { testUser } from './fixtures/test-data';

test.describe('Authentification', () => {
  test('affiche la page de connexion', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('Connexion');
    await expect(page.locator('input[name="identifiant"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('affiche le logo ANTL', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('img[alt="ANTL"]')).toBeVisible();
  });

  test('affiche le placeholder avec format identifiant', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('input[name="identifiant"]')).toHaveAttribute('placeholder', 'ndecr001');
  });

  test('redirige vers login si non authentifie', async ({ page }) => {
    await page.goto('/');

    await page.waitForURL('**/login');
    await expect(page.url()).toContain('/login');
  });

  test('connexion reussie redirige vers page principale', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="identifiant"]', testUser.identifiant);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('/');
    await expect(page.url()).not.toContain('/login');
  });

  test('affiche erreur pour identifiants incorrects', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="identifiant"]', 'wrong001');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Doit rester sur la page login avec une erreur
    await expect(page.url()).toContain('/login');
  });

  test('validation format identifiant', async ({ page }) => {
    await page.goto('/login');

    // Format invalide
    await page.fill('input[name="identifiant"]', 'invalid');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Message d'erreur de format
    await expect(page.locator('text=Format invalide')).toBeVisible();
  });
});
