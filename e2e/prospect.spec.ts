import { test, expect } from '@playwright/test';
import { login } from './fixtures/base';

test.describe('Gestion Prospect', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('affiche les informations du prospect', async ({ page }) => {
    await expect(page.locator('.prospect-info-header')).toBeVisible();
    await expect(page.locator('.prospect-info-table')).toBeVisible();
  });

  test('affiche la vue Qui est-ce', async ({ page }) => {
    await expect(page.locator('h2:has-text("Qui est-ce")')).toBeVisible();
  });

  test('affiche les sections d\'information', async ({ page }) => {
    await expect(page.locator('h3:has-text("Informations generales")')).toBeVisible();
    await expect(page.locator('h3:has-text("Contact")')).toBeVisible();
    await expect(page.locator('h3:has-text("Adresse")')).toBeVisible();
  });

  test('bouton Modifier passe en mode edition', async ({ page }) => {
    await page.click('button:has-text("Modifier")');

    await expect(page.locator('button:has-text("Enregistrer")')).toBeVisible();
    await expect(page.locator('button:has-text("Annuler")')).toBeVisible();
  });

  test('annuler retourne au mode affichage', async ({ page }) => {
    await page.click('button:has-text("Modifier")');
    await page.click('button:has-text("Annuler")');

    await expect(page.locator('button:has-text("Modifier")')).toBeVisible();
    await expect(page.locator('button:has-text("Enregistrer")')).not.toBeVisible();
  });

  test('champs editables en mode edition', async ({ page }) => {
    await page.click('button:has-text("Modifier")');

    await expect(page.locator('.qui-est-ce input').first()).toBeVisible();
  });
});
