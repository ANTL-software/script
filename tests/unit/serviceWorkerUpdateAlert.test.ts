import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('la mise à jour du Service Worker utilise la modal Confirm du Script', async () => {
  const [mainSource, notifierSource] = await Promise.all([
    readFile(path.join(process.cwd(), 'src/main.tsx'), 'utf8'),
    readFile(
      path.join(
        process.cwd(),
        'src/views/components/serviceWorkerUpdateNotifier/ServiceWorkerUpdateNotifier.tsx',
      ),
      'utf8',
    ),
  ]);

  assert.match(mainSource, /<ServiceWorkerUpdateNotifier\s*\/>/);
  assert.doesNotMatch(mainSource, /\bconfirm\s*\(/);
  assert.match(notifierSource, /navigator\.serviceWorker\.register\('\/sw\.js'\)/);
  assert.match(notifierSource, /await confirm\(\{[\s\S]*type: 'info'/);
  assert.match(notifierSource, /confirmText: 'Recharger'/);
  assert.match(notifierSource, /cancelText: 'Plus tard'/);
  assert.match(notifierSource, /window\.location\.reload\(\)/);
});
