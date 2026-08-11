import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('la CSP Script interdit les scripts inline et eval en production', async () => {
  const vercelConfig = JSON.parse(
    await readFile(path.join(process.cwd(), 'vercel.json'), 'utf8'),
  ) as {
    headers: Array<{ headers: Array<{ key: string; value: string }> }>;
  };
  const contentSecurityPolicy = vercelConfig.headers
    .flatMap((entry) => entry.headers)
    .find(({ key }) => key === 'Content-Security-Policy');
  const permissionsPolicy = vercelConfig.headers
    .flatMap((entry) => entry.headers)
    .find(({ key }) => key === 'Permissions-Policy');

  assert.ok(contentSecurityPolicy);
  assert.ok(permissionsPolicy);
  const scriptPolicy = contentSecurityPolicy.value.match(/script-src\s+([^;]+)/)?.[1] ?? '';
  assert.equal(scriptPolicy.includes("'unsafe-inline'"), false);
  assert.equal(scriptPolicy.includes("'unsafe-eval'"), false);
  assert.match(contentSecurityPolicy.value, /frame-ancestors 'none'/);
  assert.match(contentSecurityPolicy.value, /https:\/\/api-test\.antl\.fr/);
  assert.match(contentSecurityPolicy.value, /https:\/\/fonts\.googleapis\.com/);
  assert.match(contentSecurityPolicy.value, /connect-src[^;]*wss:\/\/api\.antl\.fr/);
  assert.match(permissionsPolicy.value, /microphone=\(self\)/);
  assert.doesNotMatch(permissionsPolicy.value, /microphone=\(\)/);
});
