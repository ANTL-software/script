import { test, expect } from '@playwright/test';
import { login } from './fixtures/base';
import { testIds, testProspect, API_BASE_URL } from './fixtures/test-data';

/**
 * Tests E2E pour les operations CRUD via API
 * Ces tests verifient que les interactions UI declenchent les bonnes requetes API
 */

test.describe('CRUD Prospect', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('GET - charge les informations du prospect', async ({ page }) => {
    // Intercepte la requete API
    const prospectResponse = await page.waitForResponse(
      (response) => response.url().includes('/api/prospects/') && response.request().method() === 'GET'
    );

    expect(prospectResponse.status()).toBe(200);
    const data = await prospectResponse.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id_prospect');
  });

  test('PUT - met a jour les informations du prospect', async ({ page }) => {
    // Attend le chargement
    await expect(page.locator('h2:has-text("Qui est-ce")')).toBeVisible({ timeout: 10000 });

    // Passe en mode edition
    const modifyButton = page.locator('.qui-est-ce__actions button:has-text("Modifier")');
    await expect(modifyButton).toBeVisible({ timeout: 5000 });
    await modifyButton.click();

    // Attend que le mode edition soit actif
    await expect(page.locator('.qui-est-ce__actions button:has-text("Enregistrer")')).toBeVisible({ timeout: 5000 });

    // Modifie un champ (telephone) - utilise un numero different de l'actuel
    const telephoneInput = page.locator('.qui-est-ce__section:has-text("Contact") input').first();
    const currentValue = await telephoneInput.inputValue();
    const newPhone = currentValue === '0611111111' ? '0622222222' : '0611111111';
    await telephoneInput.fill('');
    await telephoneInput.fill(newPhone);

    // Intercepte la requete de mise a jour
    const updatePromise = page.waitForResponse(
      (response) => response.url().includes('/api/prospects/') && response.request().method() === 'PUT'
    );

    // Enregistre
    await page.click('.qui-est-ce__actions button:has-text("Enregistrer")');

    const updateResponse = await updatePromise;
    expect(updateResponse.status()).toBe(200);
    const data = await updateResponse.json();
    expect(data.success).toBe(true);
  });
});

test.describe('CRUD Appels', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('GET - charge l\'historique des appels', async ({ page }) => {
    // Navigate to historique appels - l'API est appelee lors du clic
    await page.click('button:has-text("Historique appels")');

    // Attend que la vue historique soit visible
    await expect(page.locator('h2:has-text("Historique des appels")')).toBeVisible({ timeout: 10000 });

    // Verifie que le composant est charge (soit liste soit message vide)
    const historiqueContent = page.locator('.historique-appels, .historique-appels__empty');
    await expect(historiqueContent).toBeVisible();
  });

  test('POST - cree un appel via closing modal', async ({ page }) => {
    // Configure un pending closing
    await page.evaluate(() => {
      localStorage.setItem('antl_pending_closing', JSON.stringify({
        prospectId: 1,
        prospectName: 'Jean Martin',
        campagneId: 1,
        timestamp: Date.now(),
      }));
    });

    // Recharge pour afficher la modale
    await page.reload();
    await expect(page.locator('.closing-modal')).toBeVisible({ timeout: 5000 });

    // Selectionne un statut
    await page.click('.closing-modal >> text=Vente conclue');

    // Ajoute une note
    await page.fill('.closing-modal textarea', 'Test automatise - vente reussie');

    // Intercepte la requete de creation
    const createPromise = page.waitForResponse(
      (response) => response.url().includes('/api/appels') && response.request().method() === 'POST'
    );

    // Valide
    await page.click('.closing-modal button:has-text("Valider")');

    const createResponse = await createPromise;
    expect(createResponse.status()).toBe(201);
    const data = await createResponse.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id_appel');
  });
});

test.describe('CRUD Ventes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('GET - charge l\'historique des ventes', async ({ page }) => {
    // Navigate to historique offres
    await page.click('button:has-text("Historique offres")');

    // Intercepte la requete API
    const ventesResponse = await page.waitForResponse(
      (response) => response.url().includes('/api/ventes') && response.request().method() === 'GET',
      { timeout: 10000 }
    );

    expect(ventesResponse.status()).toBe(200);
    const data = await ventesResponse.json();
    expect(data.success).toBe(true);
  });

  test('POST - cree une vente complete', async ({ page }) => {
    // Va sur la page commande
    await page.click('button:has-text("Commande")');
    await expect(page.locator('h2:has-text("Catalogue")')).toBeVisible({ timeout: 10000 });

    // Attend que le catalogue soit charge
    await expect(page.locator('.category-tree')).toBeVisible({ timeout: 10000 });

    // Fonction pour trouver et cliquer sur des produits dans l'arbre de categories
    const findAndAddProduct = async (): Promise<boolean> => {
      // Recupere tous les headers de categories visibles
      const headers = page.locator('.category-node__header');
      const count = await headers.count();

      for (let i = 0; i < count; i++) {
        const header = headers.nth(i);
        if (await header.isVisible()) {
          await header.click();
          await page.waitForTimeout(300);

          // Verifie s'il y a des produits visibles
          const produits = page.locator('.produit-card');
          if (await produits.count() > 0) {
            await produits.first().locator('button:has-text("Ajouter")').click();
            return true;
          }
        }
      }
      return false;
    };

    // Essaie de trouver un produit
    const found = await findAndAddProduct();
    if (!found) {
      // Si pas trouve, on skip le test (pas de produits dans la base)
      test.skip();
      return;
    }

    // Verifie que le panier n'est plus vide
    await expect(page.locator('text=Votre panier est vide')).not.toBeVisible();

    // Ouvre la modale de confirmation
    await page.click('.panier button:has-text("Valider la commande")');
    await expect(page.locator('.confirm-order-modal')).toBeVisible();

    // Remplit les champs obligatoires
    await page.fill('input#adresse', '123 Rue de Test');
    await page.fill('input#code_postal', '75001');
    await page.fill('input#ville', 'Paris');

    // Intercepte la requete de creation de vente
    const createPromise = page.waitForResponse(
      (response) => response.url().includes('/api/ventes') && response.request().method() === 'POST'
    );

    // Confirme la commande
    await page.click('.confirm-order-modal button:has-text("Confirmer")');

    const createResponse = await createPromise;
    expect(createResponse.status()).toBe(201);
    const data = await createResponse.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id_vente');
    expect(data.data).toHaveProperty('montant_total');
  });
});

test.describe('CRUD Rendez-vous', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.click('button:has-text("Rendez-vous")');
  });

  test('GET - charge les rendez-vous', async ({ page }) => {
    // Intercepte la requete API des rendez-vous
    const rdvResponse = await page.waitForResponse(
      (response) => response.url().includes('/api/rendez-vous') && response.request().method() === 'GET',
      { timeout: 10000 }
    );

    expect(rdvResponse.status()).toBe(200);
    const data = await rdvResponse.json();
    expect(data.success).toBe(true);
  });

  test('POST - cree un nouveau rendez-vous', async ({ page }) => {
    // Attend que le calendrier soit charge
    await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 10000 });

    // Ouvre la modale de creation
    await page.click('.rendez-vous button:has-text("Nouveau")');
    await expect(page.locator('.rdv-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.rdv-modal h2')).toContainText('Nouveau rendez-vous');

    // Remplit les champs - les inputs sont dans des wrappers
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    // Input date
    const dateInput = page.locator('.rdv-modal input[type="date"]');
    await dateInput.fill(dateStr);

    // Input time
    const timeInput = page.locator('.rdv-modal input[type="time"]');
    await timeInput.fill('14:00');

    // Motif (optionnel)
    const motifField = page.locator('.rdv-modal input[type="text"]');
    if (await motifField.isVisible()) {
      await motifField.fill('Rappel commercial');
    }

    // Notes (optionnel)
    const notesField = page.locator('.rdv-modal textarea');
    if (await notesField.isVisible()) {
      await notesField.fill('Rendez-vous de test automatise');
    }

    // Intercepte la requete de creation
    const createPromise = page.waitForResponse(
      (response) => response.url().includes('/api/rendez-vous') && response.request().method() === 'POST',
      { timeout: 10000 }
    );

    // Cree le RDV (bouton Creer)
    await page.click('.rdv-modal button:has-text("Creer")');

    const createResponse = await createPromise;
    expect(createResponse.status()).toBe(201);
    const data = await createResponse.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id_rendez_vous');
  });

  test('PUT - modifie un rendez-vous existant', async ({ page }) => {
    // Attend que le calendrier soit charge
    await expect(page.locator('.rbc-calendar')).toBeVisible();

    // Cherche un evenement existant
    const event = page.locator('.rbc-event').first();

    if (await event.isVisible()) {
      // Clique sur l'evenement pour ouvrir le detail
      await event.click();

      // Verifie si la modale d'edition s'ouvre
      const editButton = page.locator('button:has-text("Modifier")');
      if (await editButton.isVisible()) {
        await editButton.click();

        // Modifie les notes
        const notesField = page.locator('textarea');
        if (await notesField.isVisible()) {
          await notesField.fill('Notes modifiees par test automatise');
        }

        // Intercepte la requete de mise a jour
        const updatePromise = page.waitForResponse(
          (response) => response.url().includes('/api/rendez-vous/') && response.request().method() === 'PUT'
        );

        await page.click('button:has-text("Enregistrer")');

        const updateResponse = await updatePromise;
        expect(updateResponse.status()).toBe(200);
      }
    }
  });

  test('DELETE - annule un rendez-vous', async ({ page }) => {
    // Attend que le calendrier soit charge
    await expect(page.locator('.rbc-calendar')).toBeVisible();

    // Cherche un evenement existant
    const event = page.locator('.rbc-event').first();

    if (await event.isVisible()) {
      await event.click();

      // Cherche le bouton Annuler/Supprimer
      const deleteButton = page.locator('button:has-text("Annuler le rendez-vous"), button:has-text("Supprimer")');

      if (await deleteButton.isVisible()) {
        // Intercepte la requete de suppression ou mise a jour statut
        const deletePromise = page.waitForResponse(
          (response) => response.url().includes('/api/rendez-vous/') &&
            (response.request().method() === 'DELETE' || response.request().method() === 'PATCH')
        );

        await deleteButton.click();

        // Confirme si demande
        const confirmButton = page.locator('button:has-text("Confirmer")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        const deleteResponse = await deletePromise;
        expect([200, 204]).toContain(deleteResponse.status());
      }
    }
  });
});

test.describe('CRUD Produits (Read Only)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.click('button:has-text("Commande")');
  });

  test('GET - charge les produits groupes par categorie', async ({ page }) => {
    // Intercepte la requete API des produits
    const produitsResponse = await page.waitForResponse(
      (response) => response.url().includes('/api/produits') && response.request().method() === 'GET',
      { timeout: 10000 }
    );

    expect(produitsResponse.status()).toBe(200);
    const data = await produitsResponse.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('categories');
  });

  test('GET - recherche de produits', async ({ page }) => {
    // Attend que le catalogue soit charge
    await expect(page.locator('.catalogue-produits')).toBeVisible({ timeout: 10000 });

    // Passe en mode recherche
    await page.click('.catalogue-produits button:has-text("Recherche")');

    // Tape une recherche (minimum 3 caracteres)
    const searchInput = page.locator('.catalogue-produits input[placeholder*="Rechercher"]');
    await searchInput.fill('sac');

    // Attend le debounce de la recherche
    await page.waitForTimeout(600);

    // La recherche est cote client donc verifie simplement que la vue change
    // Soit on a une grille de resultats, soit un message "aucun produit"
    const hasResults = await page.locator('.catalogue-produits__grid .produit-card').count() > 0;
    const hasEmptyMessage = await page.locator('.catalogue-produits__empty').isVisible();

    expect(hasResults || hasEmptyMessage).toBeTruthy();
  });
});

test.describe('API Objections (Read Only)', () => {
  test('GET - charge les objections via bouton', async ({ page, context }) => {
    await login(page);

    // Attend que la page principale soit chargee
    await expect(page.locator('.prospect-info-header')).toBeVisible({ timeout: 10000 });

    // Ouvre les objections dans une nouvelle fenetre
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('button:has-text("Objections")'),
    ]);

    // Attend que la nouvelle page charge les objections
    await newPage.waitForLoadState('domcontentloaded');

    // Verifie que la page objections est chargee correctement
    // Soit on voit les objections, soit un message d'erreur si pas de campagne
    const objectionContent = newPage.locator('.objections-page, .objections-page__error');
    await expect(objectionContent).toBeVisible({ timeout: 10000 });

    await newPage.close();
  });
});

test.describe('API Plan Appel (Read Only)', () => {
  test('GET - charge le plan d\'appel via bouton', async ({ page, context }) => {
    await login(page);

    // Attend que la page principale soit chargee
    await expect(page.locator('.prospect-info-header')).toBeVisible({ timeout: 10000 });

    // Ouvre le plan d'appel dans une nouvelle fenetre
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('button:has-text("Plan d")'),
    ]);

    // Attend que la nouvelle page charge
    await newPage.waitForLoadState('domcontentloaded');

    // Verifie que la page plan appel est chargee correctement
    const planContent = newPage.locator('.plan-appel-page, .plan-appel-page__error');
    await expect(planContent).toBeVisible({ timeout: 10000 });

    await newPage.close();
  });
});

test.describe('API Campagne', () => {
  test('GET - charge les informations de la campagne', async ({ page }) => {
    await login(page);

    // La campagne est chargee au demarrage
    const campagneResponse = await page.waitForResponse(
      (response) => response.url().includes('/api/campagnes/') && response.request().method() === 'GET',
      { timeout: 10000 }
    );

    expect(campagneResponse.status()).toBe(200);
    const data = await campagneResponse.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id_campagne');
    expect(data.data).toHaveProperty('nom_campagne');
  });
});
