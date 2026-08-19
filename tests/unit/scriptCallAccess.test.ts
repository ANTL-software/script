import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  buildScriptCallBlockAlertMessage,
  getScriptCallBlockNotice,
} from '../../src/utils/scripts/scriptCallAccess.ts';
import type { Employe } from '../../src/utils/types/user.types.ts';

const blockedEmployee: Employe = {
  id_employe: 4,
  identifiant: 'jmart004',
  nom: 'Martin',
  prenom: 'Julie',
  actif: true,
  appels_script_bloques: true,
  motif_blocage_appels_script: 'Repos demandé par la direction',
  appels_script_bloques_jusqu_au: '2026-08-19T16:00:00.000Z',
};

test('exposes the supervisor reason for a blocked employee', () => {
  assert.deepEqual(getScriptCallBlockNotice(blockedEmployee), {
    reason: 'Repos demandé par la direction',
    blockedUntil: '2026-08-19T16:00:00.000Z',
  });
});

test('does not lock an employee whose effective API state is unblocked', () => {
  assert.equal(getScriptCallBlockNotice({ ...blockedEmployee, appels_script_bloques: false }), null);
});

test('builds a non-technical alert covering logout, reason and scheduled recovery', () => {
  const message = buildScriptCallBlockAlertMessage({
    reason: 'Repos demandé par la direction',
    blockedUntil: '2026-08-19T16:00:00.000Z',
  });

  assert.match(message, /déconnecté/);
  assert.match(message, /appuyé sur « OK »/);
  assert.match(message, /Motif :\nRepos demandé par la direction/);
  assert.match(message, /Déblocage automatique prévu/);
});

test('waits for the informational modal acknowledgement before logging out', async () => {
  const source = await readFile('src/hooks/useScriptCallAccessGuard.ts', 'utf8');
  const alertPosition = source.indexOf('await showAlert({');
  const logoutPosition = source.indexOf('await logout();');

  assert.notEqual(alertPosition, -1);
  assert.notEqual(logoutPosition, -1);
  assert.ok(alertPosition < logoutPosition);
  assert.match(source, /acknowledgeOnly:\s*true/);
  assert.match(source, /confirmText:\s*'OK'/);
});
