import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('le Script distingue le marqueur de session production de celui de test', async () => {
  const apiClientSource = await readFile(
    path.join(process.cwd(), 'src/API/config.ts'),
    'utf8',
  );
  const runtimeEnvironmentSource = await readFile(
    path.join(process.cwd(), 'src/utils/scripts/runtimeEnvironment.ts'),
    'utf8',
  );

  assert.match(apiClientSource, /getSessionMarkerName/);
  assert.match(runtimeEnvironmentSource, /session_active_test/);
  assert.match(runtimeEnvironmentSource, /session_active/);
  assert.match(runtimeEnvironmentSource, /isProspectTestMode/);
  assert.match(runtimeEnvironmentSource, /!isTestEnvironment/);
});

test('le Script ne journalise jamais les cookies lisibles du navigateur', async () => {
  const userProviderSource = await readFile(
    path.join(process.cwd(), 'src/context/userContext/UserProvider.tsx'),
    'utf8',
  );

  assert.equal(userProviderSource.includes('document.cookie'), false);
});
