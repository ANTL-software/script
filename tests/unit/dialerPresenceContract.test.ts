import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('la fermeture d un onglet ne bascule jamais globalement le dialer hors ligne', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'src/context/dialerContext/DialerProvider.tsx'),
    'utf8',
  );
  const lifecycleSource = source.slice(
    source.indexOf('const resolveRuntimeCampaign = useCallback'),
    source.indexOf('// FONCTIONS D\'APPEL'),
  );

  assert.match(lifecycleSource, /dialerService\.heartbeat\(\)/);
  assert.match(lifecycleSource, /setInterval\(sendHeartbeat, 60000\)/);
  assert.doesNotMatch(source, /beforeunload/);
  assert.doesNotMatch(lifecycleSource, /statut:\s*'hors_ligne'/);
});
