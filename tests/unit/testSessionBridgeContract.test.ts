import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();

test('Utilisateur TEST ouvre une session API test avant la navigation complète', async () => {
  const userService = await readFile(
    path.join(ROOT, 'src/API/services/User.service.ts'),
    'utf8',
  );
  const dashboardHook = await readFile(
    path.join(ROOT, 'src/hooks/useDashboardPage.ts'),
    'utf8',
  );

  assert.match(userService, /\/auth\/test-session\/ticket/);
  assert.match(userService, /\/auth\/test-session\/exchange/);
  assert.match(userService, /withCredentials:\s*true/);
  assert.match(dashboardHook, /await userService\.openTestSession\(currentCampagneId\)/);
  assert.match(dashboardHook, /window\.location\.assign\(TEST_PROSPECT_URL\)/);
});

test('le mode fiche de formation coupe Twilio et recharge la session production au retour', async () => {
  const runtimeEnvironment = await readFile(
    path.join(ROOT, 'src/utils/scripts/runtimeEnvironment.ts'),
    'utf8',
  );
  const navigationHook = await readFile(
    path.join(ROOT, 'src/hooks/useNavigation.ts'),
    'utf8',
  );

  assert.match(runtimeEnvironment, /return isProspectTestMode\(\)/);
  assert.match(navigationHook, /window\.location\.assign\('\/'\)/);
});
