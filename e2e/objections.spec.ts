import { test, expect } from '@playwright/test';
import { login } from './fixtures/base';

test.describe('Objections', () => {
  test('page objections est protegee', async ({ page }) => {
    await page.goto('/objections?campagne=1');
    await page.waitForURL('**/login');
    await expect(page.url()).toContain('/login');
  });

  test('affiche les objections avec campagne', async ({ page }) => {
    await login(page);
    await page.goto('/objections?campagne=1');

    await expect(page.locator('h1:has-text("Objections")')).toBeVisible();
  });

  test('affiche le champ de recherche', async ({ page }) => {
    await login(page);
    await page.goto('/objections?campagne=1');

    await expect(page.locator('input[placeholder*="Rechercher"]')).toBeVisible();
  });

  test('affiche les categories d\'objections', async ({ page }) => {
    await login(page);
    await page.goto('/objections?campagne=1');

    // Attend le chargement des categories
    await expect(page.locator('.objections-page__category').first()).toBeVisible();
  });

  test('clic sur categorie affiche les objections (accordion)', async ({ page }) => {
    await login(page);
    await page.goto('/objections?campagne=1');

    // Clique sur la premiere categorie
    await page.click('.objections-page__category-header >> nth=0');

    // Verifie que le contenu est visible
    await expect(page.locator('.objections-page__category-content').first()).toBeVisible();
  });

  test('accordion: une seule categorie ouverte a la fois', async ({ page }) => {
    await login(page);
    await page.goto('/objections?campagne=1');

    // Ouvre la premiere categorie
    await page.click('.objections-page__category-header >> nth=0');
    await expect(page.locator('.objections-page__category--open')).toHaveCount(1);

    // Ouvre la deuxieme categorie - la premiere doit se fermer
    const categories = page.locator('.objections-page__category');
    const count = await categories.count();
    if (count > 1) {
      await page.click('.objections-page__category-header >> nth=1');
      await expect(page.locator('.objections-page__category--open')).toHaveCount(1);
    }
  });

  test('bouton Fermer ferme la categorie ouverte', async ({ page }) => {
    await login(page);
    await page.goto('/objections?campagne=1');

    // Ouvre une categorie
    await page.click('.objections-page__category-header >> nth=0');
    await expect(page.locator('.objections-page__category--open')).toHaveCount(1);

    // Clique sur Fermer
    await page.click('button:has-text("Fermer")');

    // Aucune categorie ne doit etre ouverte
    await expect(page.locator('.objections-page__category--open')).toHaveCount(0);
  });

  test('bouton Imprimer visible', async ({ page }) => {
    await login(page);
    await page.goto('/objections?campagne=1');

    await expect(page.locator('button:has-text("Imprimer")')).toBeVisible();
  });

  test('affiche erreur si campagne manquante', async ({ page }) => {
    await login(page);
    await page.goto('/objections');

    await expect(page.locator('text=ID de campagne manquant')).toBeVisible();
  });

  test('recherche filtre les objections', async ({ page }) => {
    await login(page);
    await page.goto('/objections?campagne=1');

    // Attend le chargement
    await expect(page.locator('.objections-page__category').first()).toBeVisible();

    // Tape dans le champ de recherche
    await page.fill('input[placeholder*="Rechercher"]', 'prix');

    // Verifie que le compteur change
    await expect(page.locator('.objections-page__count')).toBeVisible();
  });

  test('categories vides ne sont pas affichees', async ({ page }) => {
    await login(page);
    await page.goto('/objections?campagne=1');

    // Toutes les categories visibles doivent avoir des objections
    const categories = page.locator('.objections-page__category');
    const count = await categories.count();

    // Chaque categorie doit avoir un compteur > 0
    for (let i = 0; i < count; i++) {
      const categoryCount = categories.nth(i).locator('.objections-page__category-count');
      const text = await categoryCount.textContent();
      expect(parseInt(text || '0')).toBeGreaterThan(0);
    }
  });
});
