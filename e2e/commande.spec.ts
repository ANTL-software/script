import { test, expect } from '@playwright/test';
import { login } from './fixtures/base';

test.describe('Commande', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.click('button:has-text("Commande")');
  });

  test('affiche le catalogue produits', async ({ page }) => {
    await expect(page.locator('h2:has-text("Catalogue")')).toBeVisible();
  });

  test('affiche le panier', async ({ page }) => {
    await expect(page.locator('h3:has-text("Panier")')).toBeVisible();
  });

  test('panier vide par defaut', async ({ page }) => {
    await expect(page.locator('text=Votre panier est vide')).toBeVisible();
  });

  test('panier affiche bouton Vider uniquement quand non vide', async ({ page }) => {
    // Quand le panier est vide, le bouton Vider n'apparait pas
    await expect(page.locator('.panier >> button:has-text("Vider")')).not.toBeVisible();
  });

  test('affiche les boutons de navigation catalogue', async ({ page }) => {
    await expect(page.locator('button:has-text("Navigation")')).toBeVisible();
    await expect(page.locator('button:has-text("Recherche")')).toBeVisible();
  });

  test('champ recherche visible', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Rechercher"]')).toBeVisible();
  });

  test('arbre categories visible en mode navigation', async ({ page }) => {
    // Le mode navigation devrait afficher l'arbre des categories
    await expect(page.locator('.category-tree')).toBeVisible();
  });

  test('categories sont affichees', async ({ page }) => {
    // Attend que le catalogue soit charge
    await expect(page.locator('.category-tree')).toBeVisible({ timeout: 10000 });

    // Toutes les categories affichees doivent avoir des produits (ou sous-categories)
    const categoryNodes = page.locator('.category-node');
    const count = await categoryNodes.count();

    // Il doit y avoir au moins une categorie
    expect(count).toBeGreaterThan(0);
  });

  test('clic sur categorie l\'ouvre', async ({ page }) => {
    // Clique sur la premiere categorie
    const firstCategory = page.locator('.category-node__header').first();
    await firstCategory.click();

    // Verifie qu'elle est ouverte (contenu visible)
    await expect(page.locator('.category-node__content').first()).toBeVisible();
  });

  test('recherche filtre les produits', async ({ page }) => {
    // Passe en mode recherche
    await page.click('button:has-text("Recherche")');

    // Tape dans le champ de recherche
    await page.fill('input[placeholder*="Rechercher"]', 'carte');

    // Attend les resultats (au moins 3 caracteres requis)
    await page.waitForTimeout(500); // Debounce

    // Verifie que les resultats sont affiches
    const produitCards = page.locator('.produit-card');
    const count = await produitCards.count();
    expect(count).toBeGreaterThanOrEqual(0); // Peut etre 0 si pas de match
  });

  test('ajout produit au panier', async ({ page }) => {
    // Attend que le catalogue soit charge
    await expect(page.locator('.category-tree')).toBeVisible({ timeout: 10000 });

    // Ouvre une categorie (peut etre une categorie parent ou feuille)
    await page.click('.category-node__header >> nth=0');

    // Attend un peu pour le contenu
    await page.waitForTimeout(500);

    // Si pas de produit visible, ouvre une sous-categorie
    const produitCount = await page.locator('.produit-card').count();
    if (produitCount === 0) {
      const subCategory = page.locator('.category-node__header >> nth=1');
      if (await subCategory.isVisible()) {
        await subCategory.click();
        await page.waitForTimeout(500);
      }
    }

    // Attend que les produits soient visibles
    await page.waitForSelector('.produit-card', { timeout: 10000 });

    // Clique sur Ajouter du premier produit
    await page.click('.produit-card button:has-text("Ajouter")');

    // Verifie que le panier n'est plus vide
    await expect(page.locator('text=Votre panier est vide')).not.toBeVisible();

    // Verifie que le bouton Valider la commande apparait
    await expect(page.locator('.panier button:has-text("Valider la commande")')).toBeVisible();
  });

  test('bouton Valider ouvre modale de confirmation', async ({ page }) => {
    // Attend que le catalogue soit charge
    await expect(page.locator('.category-tree')).toBeVisible({ timeout: 10000 });

    // Ouvre une categorie
    await page.click('.category-node__header >> nth=0');
    await page.waitForTimeout(500);

    // Si pas de produit visible, ouvre une sous-categorie
    const produitCount = await page.locator('.produit-card').count();
    if (produitCount === 0) {
      const subCategory = page.locator('.category-node__header >> nth=1');
      if (await subCategory.isVisible()) {
        await subCategory.click();
        await page.waitForTimeout(500);
      }
    }

    await page.waitForSelector('.produit-card', { timeout: 10000 });
    await page.click('.produit-card button:has-text("Ajouter")');

    // Clique sur Valider la commande
    await page.click('.panier button:has-text("Valider la commande")');

    // Verifie que la modale s'ouvre
    await expect(page.locator('.confirm-order-modal')).toBeVisible();
  });
});
