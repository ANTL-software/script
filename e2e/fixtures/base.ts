import { test as base, expect } from '@playwright/test';
import { testUser } from './test-data';

/**
 * Fixture etendue avec authentification
 */
export const test = base.extend<{
  authenticatedPage: ReturnType<typeof base['page']>;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Se connecter
    await page.goto('/login');
    await page.fill('input[name="identifiant"]', testUser.identifiant);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Attendre la redirection vers la page principale
    await page.waitForURL('/');

    await use(page);
  },
});

/**
 * Helper pour se connecter dans un test
 */
export async function login(page: ReturnType<typeof base['page']>) {
  await page.goto('/login');
  await page.fill('input[name="identifiant"]', testUser.identifiant);
  await page.fill('input[name="password"]', testUser.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

export { expect };
