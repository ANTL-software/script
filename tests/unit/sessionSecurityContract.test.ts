import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();

test('le client API protège toutes les mutations avec un token CSRF runtime', async () => {
  const apiConfig = await readFile(path.join(ROOT, 'src', 'API', 'config.ts'), 'utf8');
  const csrfService = await readFile(
    path.join(ROOT, 'src', 'API', 'services', 'csrf', 'CSRFService.ts'),
    'utf8',
  );

  assert.match(apiConfig, /new Set\(\['post', 'put', 'patch', 'delete'\]\)/);
  assert.match(apiConfig, /csrfService\.getHeaders\(\)/);
  assert.match(csrfService, /\/csrf-token/);
  assert.match(csrfService, /withCredentials:\s*true/);
});

test('le client ne récupère plus de JWT de session depuis le stockage navigateur', async () => {
  const apiConfig = await readFile(path.join(ROOT, 'src', 'API', 'config.ts'), 'utf8');
  const dialerProvider = await readFile(
    path.join(ROOT, 'src', 'context', 'dialerContext', 'DialerProvider.tsx'),
    'utf8',
  );

  assert.doesNotMatch(apiConfig, /Authorization.*Bearer/);
  assert.doesNotMatch(dialerProvider, /localStorage\.getItem\(['"]authToken['"]\)/);
});
