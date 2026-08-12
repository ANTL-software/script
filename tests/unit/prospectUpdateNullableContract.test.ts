import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('QuiEstCe transmet les chaînes vides des champs effacés pour mise à jour NULL en BDD', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'src/views/components/quiEstCe/QuiEstCe.tsx'),
    'utf8',
  );

  assert.match(source, /dataToUpdate\.prenom = editedFields\.prenom\.trim\(\)/);
  assert.match(source, /dataToUpdate\.siret = editedFields\.siret\.trim\(\)/);
  assert.match(source, /dataToUpdate\.email = editedFields\.email\.trim\(\)/);
  assert.doesNotMatch(source, /dataToUpdate\.prenom = editedFields\.prenom \|\| undefined/);
  assert.doesNotMatch(source, /dataToUpdate\.email = editedFields\.email \|\| undefined/);
});

test('useOrderConfirmation conserve les champs effacés pour la mise à jour prospect', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'src/hooks/useOrderConfirmation.ts'),
    'utf8',
  );

  assert.match(source, /prospectUpdates\.prenom = prenom/);
  assert.doesNotMatch(source, /prospectUpdates\.prenom = prenom \|\| undefined/);
});
