import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clearCallNotesDraft,
  updateCallNotesDraft,
} from '../../src/utils/scripts/callNotesDraft.ts';

test('updateCallNotesDraft conserve les notes localement sans identifiant appel', () => {
  let localNotes = '';
  let persisted = false;

  updateCallNotesDraft(
    undefined,
    'Rendez-vous confirme avec decisionnaire disponible.',
    (notes) => {
      localNotes = notes;
    },
    () => {
      persisted = true;
    },
  );

  assert.equal(localNotes, 'Rendez-vous confirme avec decisionnaire disponible.');
  assert.equal(persisted, false);
});

test('clearCallNotesDraft vide aussi le brouillon local sans identifiant appel', () => {
  let localNotes = 'Note temporaire';
  let persistedClear = false;

  clearCallNotesDraft(
    null,
    (notes) => {
      localNotes = notes;
    },
    () => {
      persistedClear = true;
    },
  );

  assert.equal(localNotes, '');
  assert.equal(persistedClear, false);
});

test('updateCallNotesDraft persiste le brouillon quand un appel existe', () => {
  let localNotes = '';
  let persistedCall: { appelId: number; notes: string } | null = null;

  updateCallNotesDraft(
    42,
    'Note persistée',
    (notes) => {
      localNotes = notes;
    },
    (appelId, notes) => {
      persistedCall = { appelId, notes };
    },
  );

  assert.equal(localNotes, 'Note persistée');
  assert.deepEqual(persistedCall, { appelId: 42, notes: 'Note persistée' });
});
