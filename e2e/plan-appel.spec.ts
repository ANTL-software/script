import { test, expect } from '@playwright/test';
import { login } from './fixtures/base';

test.describe('Plan d\'appel', () => {
  test('page plan-appel est protegee', async ({ page }) => {
    await page.goto('/plan-appel?campagne=1');
    await page.waitForURL('**/login');
    await expect(page.url()).toContain('/login');
  });

  test('affiche le plan d\'appel avec campagne', async ({ page }) => {
    await login(page);
    await page.goto('/plan-appel?campagne=1');

    await expect(page.locator('h1:has-text("Plan d\'appel")')).toBeVisible();
  });

  test('affiche les etapes du plan', async ({ page }) => {
    await login(page);
    await page.goto('/plan-appel?campagne=1');

    // Verifie la presence du stepper
    await expect(page.locator('.plan-appel-page__stepper')).toBeVisible();
  });

  test('affiche les boutons de navigation', async ({ page }) => {
    await login(page);
    await page.goto('/plan-appel?campagne=1');

    await expect(page.locator('button:has-text("Precedent")')).toBeVisible();
    await expect(page.locator('button:has-text("Suivant")')).toBeVisible();
  });

  test('bouton Precedent desactive sur premiere etape', async ({ page }) => {
    await login(page);
    await page.goto('/plan-appel?campagne=1');

    const precedentBtn = page.locator('button:has-text("Precedent")');
    await expect(precedentBtn).toBeDisabled();
  });

  test('navigation Suivant fonctionne', async ({ page }) => {
    await login(page);
    await page.goto('/plan-appel?campagne=1');

    // Attend le chargement
    await expect(page.locator('.plan-appel-page__etape-number')).toContainText('1');

    // Clique sur Suivant
    await page.click('button:has-text("Suivant")');

    // Verifie qu'on est sur l'etape 2
    await expect(page.locator('.plan-appel-page__etape-number')).toContainText('2');
  });

  test('bouton Imprimer visible', async ({ page }) => {
    await login(page);
    await page.goto('/plan-appel?campagne=1');

    await expect(page.locator('button:has-text("Imprimer")')).toBeVisible();
  });

  test('affiche erreur si campagne manquante', async ({ page }) => {
    await login(page);
    await page.goto('/plan-appel');

    await expect(page.locator('text=ID de campagne manquant')).toBeVisible();
  });
});
