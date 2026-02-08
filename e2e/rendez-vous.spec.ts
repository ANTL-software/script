import { test, expect } from '@playwright/test';
import { login } from './fixtures/base';

test.describe('Rendez-vous', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.click('button:has-text("Rendez-vous")');
  });

  test('affiche le calendrier', async ({ page }) => {
    await expect(page.locator('h2:has-text("Rendez-vous")')).toBeVisible();
    await expect(page.locator('.rbc-calendar')).toBeVisible();
  });

  test('affiche la legende des statuts', async ({ page }) => {
    await expect(page.locator('text=Planifie')).toBeVisible();
    await expect(page.locator('text=Effectue')).toBeVisible();
    await expect(page.locator('text=Reporte')).toBeVisible();
    await expect(page.locator('text=Annule')).toBeVisible();
  });

  test('bouton Nouveau visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Nouveau")')).toBeVisible();
  });

  test('navigation vue Mois', async ({ page }) => {
    await page.click('button:has-text("Mois")');
    await expect(page.locator('.rbc-month-view')).toBeVisible();
  });

  test('navigation vue Semaine', async ({ page }) => {
    await page.click('button:has-text("Semaine")');
    await expect(page.locator('.rbc-time-view')).toBeVisible();
  });

  test('navigation vue Jour', async ({ page }) => {
    await page.click('button:has-text("Jour")');
    await expect(page.locator('.rbc-time-view')).toBeVisible();
  });

  test('bouton Nouveau ouvre modale', async ({ page }) => {
    await page.click('button:has-text("Nouveau")');
    await expect(page.locator('h2:has-text("Nouveau rendez-vous")')).toBeVisible();
  });

  test('modale contient champs date et heure', async ({ page }) => {
    await page.click('button:has-text("Nouveau")');
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[type="time"]')).toBeVisible();
  });

  test('fermer modale avec Annuler', async ({ page }) => {
    await page.click('button:has-text("Nouveau")');
    await page.click('button:has-text("Annuler")');
    await expect(page.locator('h2:has-text("Nouveau rendez-vous")')).not.toBeVisible();
  });
});
